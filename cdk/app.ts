import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { App, Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ApiDefinition, ApiKey, SpecRestApi } from 'aws-cdk-lib/aws-apigateway';

const app = new App();

const lambdaDefaults = {
  runtime: Runtime.NODEJS_20_X,
  bundling: {
    format: OutputFormat.ESM,
    target: 'es2020,node20'
  }
};

class AppStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id);

    const helloHandler = new NodejsFunction(this, 'hello-handler', {
      ...lambdaDefaults,
      entry: 'src/hello.handler.ts',
      handler: 'handler'
    });

    const mockAuthorizer = new NodejsFunction(this, 'mock-authorizer', {
      ...lambdaDefaults,
      entry: 'src/mock.authorizer.ts',
      handler: 'handler'
    });

    const apiGateway = new SpecRestApi(this, 'api-gateway', {
      apiDefinition: ApiDefinition.fromInline(this.loadApiDefinition([
        {
          key: '$LAMBDA_HELLO_HANDLER$',
          value: helloHandler.functionArn
        },
        {
          key: '$LAMBDA_MOCK_AUTHORIZER$',
          value: mockAuthorizer.functionArn
        }
      ]))
    });

    const apiKey = new ApiKey(this, 'api-gateway-key', { enabled: true });

    apiGateway.addUsagePlan('default').addApiKey(apiKey);
  }

  private loadApiDefinition(replaceKeys: Array<{ key: string; value: string; }>) {
    let apiDefinitionRaw = readFileSync('api.yaml', 'utf8');

    replaceKeys.forEach(({ key, value }) => {
      apiDefinitionRaw = apiDefinitionRaw.replaceAll(key, value);
    });

    const apiDefinition = load(apiDefinitionRaw);

    if (process.env.REMOVE_API_KEY_AUTHORIZER) {
      this.removeApiKeyAuthorizer(apiDefinition);
    }

    return apiDefinition;
  }

  private removeApiKeyAuthorizer(spec: any) {
    delete spec.components.securitySchemes.ApiKey;

    Object.values(spec.paths).forEach((pathSpec: any) => {
      Object.values(pathSpec).forEach((methodSpec: any) => {
        if (methodSpec.security) {
          methodSpec.security = methodSpec.security.filter((securitySpec: any) => !securitySpec.ApiKey);
        }
      });
    });
  }
}

new AppStack(app, 'app');
