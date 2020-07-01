## Run server environment
This will launch an instance of the analytics service and an instance of redis
```
docker-compose up
```

## Traffic generator command
To simulate user interactions with products on display, first make sure the docker environment is up. 
Then use the supplied command with a custom start and end dates.
Install the node dependencies. You must have NodeJS v10 or above to run the command.

global install
```sh-session
$ cd perch-command
$ npm install -g perch
$ perch --from=2020-06-29T10:00:00.000Z --to=2020-06-29T23:00:00.000Z products.txt
```

ALTERNATIVE: local install
```sh-session
$ cd perch-command
$ npm install perch
$ ./bin/run --from=2020-06-29T10:00:00.000Z --to=2020-06-29T23:00:00.000Z products.txt
```
Note: products.txt is supplied for convenience. It contains a list of product in csv format with id,name per line and no header row.

Pass `--help` for additional flags

## Sample Curls

You can ping the server manually by running one of the curl commands below

### Pick Up event
```sh-session
curl -X POST http://localhost:8080/api/v1/displays/1/events \
  --header 'content-type: application/json' \
  --data '{"productId":"123","productName":"Perfume 123","type":"pickup","timestamp":"2020-06-29T22:32:00.508Z"}'
```

### Screen Touch event
```sh-session
curl -X POST http://localhost:8080/api/v1/displays/1/events \
  --header 'content-type: application/json' \
  --data '{"productId":"123","productName":"Perfume 123","type":"pickup","target":"test","timestamp":"2020-06-29T22:33:00.508Z"}'
```

### Put Down event
```sh-session
curl -X POST http://localhost:8080/api/v1/displays/1/events \
  --header 'content-type: application/json' \
  --data '{"productId":"123","productName":"Perfume 123","type":"putdown", "timestamp":"2020-06-29T22:34:20.508Z"}'
```

### Get events by date range
```sh-session
curl 'http://localhost:8080/api/v1/displays/displayId/events?from=2020-06-30T10%3A00%3A00.000Z&to=2020-06-30T22%3A00%3A00.000Z'
```

### Get events by date range and filter by product id and event types
```sh-session
curl 'http://localhost:8080/api/v1/displays/displayId/events?from=2020-06-30T10%3A00%3A00.000Z&to=2020-06-30T22%3A00%3A00.000Z&productId=112&events=pickup%2Cputdown'
```
## API Documentation

You can access the api documentation by running the following command on Mac terminal:
```
open http://localhost:8080/ui
```