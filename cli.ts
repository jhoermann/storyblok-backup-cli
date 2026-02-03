import { cancel, intro, isCancel, outro, select, text } from '@clack/prompts'
import 'zx/globals'
import dotenv from 'dotenv'
dotenv.config({ quiet: true })
import backupSpace from './commands/backup-space.js'
import restoreSpace from './commands/restore-space.js'

type Task = 'backup' | 'restore'

const getTask = async () => {
    const givenTask: Task | undefined = argv['backup'] ? 'backup' : argv['restore'] ? 'restore' : undefined
    if (givenTask) {
        return givenTask
    }
    return select({
        message: 'Backup or restore?',
        options: [
            { value: 'backup', label: 'Backup' },
            { value: 'restore', label: 'Restore' },
        ],
    })
}

const getToken = async () => {
    const givenToken: string | undefined = argv['token'] || process.env['STORYBLOK_TOKEN']
    if (givenToken) {
        return givenToken
    }
    return text({
        message: 'Storyblok token:',
        validate: (value) => (value ? undefined : 'Token must be defined.'),
    })
}

const getSpaces = async () => {
    const givenSpaces: string | undefined = argv['spaces'] || process.env['STORYBLOK_SPACES']
    if (givenSpaces) {
        return givenSpaces
    }
    return text({
        message: 'Spaces (comma-separated, format: label:id):',
        placeholder: 'my-space:12345,another:67890',
        validate: (value) => (value ? undefined : 'Spaces must be defined.'),
    })
}
const getSpacesMap = (spaces: string): Map<string, string> =>
    new Map(
        spaces
            .split(',')
            .map(getSpaceEntry)
            .filter((spaceEntry) => spaceEntry[0] && spaceEntry[1]),
    )
const getSpaceEntry = (value: string): [string, string] => {
    const space = value.split(':')
    if (space.length >= 2 && space[0] && space[1]) {
        return [space[0], space[1]]
    }
    if (space.length >= 2 && !space[0] && space[1]) {
        return [space[1], space[1]]
    }
    if (space.length === 1 && space[0]) {
        return [space[0], space[0]]
    }
    return ['', '']
}

const getAdditionalArgs = async () => {
    const givenArgs: string | undefined = argv['args'] || process.env['STORYBLOK_ARGS']
    if (givenArgs) {
        return givenArgs
    }
    const args = await text({
        message: 'Additional arguments (optional):',
        defaultValue: '',
    })
    return args.toString()
}
const parseArgs = (args: string): string[] => args.split(/\s+/).filter(Boolean)

const checkCancel = (possiblyCancelled: string | symbol) => {
    if (isCancel(possiblyCancelled)) {
        cancel('Canceled')
        process.exit(0)
    }
    return possiblyCancelled
}

intro('storyblok-backup-cli')
const task = checkCancel(await getTask())
const token = checkCancel(await getToken())
const spaces = checkCancel(await getSpaces())
const spacesMap = getSpacesMap(spaces)
const additionalArgsRaw = await getAdditionalArgs()
const passthroughArgs = parseArgs(additionalArgsRaw)

const spacesEntries = [...spacesMap.entries()]
for (const [spaceName, spaceId] of spacesEntries) {
    if (task === 'backup') {
        await backupSpace(token as string, spaceName, spaceId, passthroughArgs)
    } else {
        await restoreSpace(token as string, spaceName, spaceId, passthroughArgs)
    }
}

outro('Finished!')
