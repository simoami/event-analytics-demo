import {Command, flags} from '@oclif/command'
import * as moment from 'moment'
import {generateSessions} from './sessions'
import * as fs from 'async-file'

class Perch extends Command {
  static description = 'generate random product interaction sessions'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    from: flags.string({
      description: 'start date time of interaction in iso format',
    }),
    to: flags.string({
      description: 'end date time of interaction in iso format',
    }),
  }

  static args = [{
    name: 'file',
    required: true,
    description: 'a file containing the list of products to interact with',
  }]

  async run() {
    const {args, flags} = this.parse(Perch)

    if (!flags.from) {
      this.error('--from is required')
    }
    if (!args.file) {
      this.error('FILE is required')
    }
    let products = []
    try {
      const data = await fs.readFile(args.file, 'utf8')
      products = data.split('\n').map(row => {
        const parts = row.split(',')
        return {id: parts[0], name: parts[1]}
      })
    } catch (error) {
      this.error('FILE is required')
    }

    const fromDate = moment(flags.from)
    const toDate = flags.to ? moment(flags.to) : fromDate.add(1, 'days')
    if (toDate.diff(fromDate, 'minutes', true) < 5) {
      this.error('date range must be at least 5 minutes')
    }
    generateSessions(products, fromDate, toDate)
  }
}

export = Perch
