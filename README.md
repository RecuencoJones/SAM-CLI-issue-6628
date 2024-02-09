# SAM CLI issue \#6628

## Setup

```shell
npm ci
```

## SAM with single authorizer

```shell
export REMOVE_API_KEY_AUTHORIZER=1

npm start
```

Then on another terminal

```shell
bash ./scripts/test.sh
```

## SAM with multiple authorizer

```shell
export REMOVE_API_KEY_AUTHORIZER=

npm start
```

This will fail due to the multiple authorizer specifications
