import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

export async function handler(event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> {
  return {
    principalId: 'user@mo.ck',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: getMethodArn(event.methodArn)
        }
      ]
    },
    context: {
      mail: 'user@mo.ck',
      isAuth: true
    }
  };
}

function getMethodArn(methodArn: string): string {
  const [ awsRegion, awsAccountId, apiGatewayArn ] = methodArn.split(':').slice(3);
  const [ restApiId, restApiStage, restApiMethod ] = apiGatewayArn.split('/');

  const targetMethodArn = [ restApiId, restApiStage, restApiMethod, '*' ].join('/');

  return [ 'arn', 'aws', 'execute-api', awsRegion, awsAccountId, targetMethodArn ].join(':');
}
