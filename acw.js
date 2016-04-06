'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')
const child_process = require('child_process')
const debugLog = util.debuglog('acw')

exports.main = main

if (require.main === module) main()

// main entry point
function main () {
  const cmd = process.argv[2] || ''
  const group = process.argv[3] || ''
  const opts = process.argv.slice(4)

  if (cmd === '') help()

  switch (cmd) {
    case 'ls':
      do_ls(group)
      break

    case 'update':
      if (group === '') help()
      do_update(group, opts)
      break

    case 'dump':
      if (group === '') help()

      let prefix = opts[0]
      if (prefix == null) {
        let match = new Date().toISOString().match(/^(.*?)-(.*?)-(.*?)T/)
        prefix = `${match[1]}/${match[2]}/${match[3]}`
      }

      do_dump(group, prefix)
      break

    default:
      help()
  }
}

// list log groups
function do_ls (group) {
  if (group == null) {
    for (let group of getLogGroupNames()) {
      console.log(group)
    }
    return
  }

  for (let stream of getLogStreamNames(group)) {
    console.log(stream)
  }
}

// download a log group
function do_update (group, opts) {
  console.log(`do_dump(${group})`)
}

// print a log group
function do_dump (group, prefix) {
  for (let stream of getLogStreamNames(group)) {
    if (stream.indexOf(prefix) !== 0) continue

    getLogMessages(group, stream).forEach((message) =>
      console.log(message)
    )
  }
}

function getLogGroupNames () {
  const cmd = 'describe-log-groups'

  return awsCommandPaged(cmd, 'logGroups')
    .map((group) => group.logGroupName)
}

function getLogStreamNames (logGroup) {
  const cmd = `describe-log-streams --log-group-name "${logGroup}"`

  return awsCommandPaged(cmd, 'logStreams')
    .map((stream) => stream.logStreamName)
}

function getLogMessages (logGroup, logStream) {
  const cmd = `get-log-events --log-group-name '${logGroup}' --log-stream-name '${logStream}'`

  return awsCommandPaged(cmd, 'events', '--next-token', 'nextForwardToken')
    .map((event) => normalizeMessage(event))
}

function normalizeMessage (event) {
  let message = event.message.trim()
  let timeStamp = event.timestamp

  const match = message.match(/(\w+) RequestId: (.*?)($| (.*))/)
  if (match) {
    let end = (match[4] || '').trim()
    return [
      left(new Date(timeStamp).toISOString(),24),
      left(match[2], 36),
      match[1],
      end
    ].join(' ')
  }

  message = message.split(/\t/g)
  return [
    left(message[0], 24),
    left(message[1], 36),
    message.slice(2).join('\t')
  ].join(' ')
}

function left (string, length) {
  string = '' + string
  while (string.length < length) string += ' '
  return string
}

function awsCommandPaged (cmd, property, nextPageOpt, nextPageProp) {
  nextPageOpt = nextPageOpt || '--starting-token'
  nextPageProp = nextPageProp || 'nextToken'

  let items = []
  let result = awsCommand(cmd)

  items = items.concat(result[property])

  while (result[nextPageProp]) {
    result = awsCommand(`${cmd} ${nextPageOpt} ${result[nextPageProp]}`)
    if (result[property].length === 0) break

    items = items.concat(result[property])
  }

  return items
}

// run an aws command, return object result
function awsCommand (cmd) {
  debugLog('running command: %s', cmd)
  cmd = `aws logs ${cmd}`

  const opts = {
    stdio: ['ignore', 'pipe', process.stderr],
    encoding: 'utf8'
  }

  var result = child_process.execSync(cmd, opts)

  return JSON.parse(result)
}

// print some help
function help () {
  const helpFile = path.join(__dirname, 'README.md')
  const help = fs.readFileSync(helpFile, 'utf8')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')

  console.log(help)
  process.exit(0)
}
