import { log } from '@clack/prompts'
import fs from 'fs'
import path from 'path'
import 'zx/globals'

const restoreTypes = {
    'component-groups': 'component-group',
    components: 'component',
    datasources: 'datasource',
    'asset-folders': 'asset-folder',
    assets: 'asset',
    'internal-tags': 'internal-tag',
    'space-roles': 'space-role',
    workflows: 'workflow',
    'workflow-stages': 'workflow-stage',
    releases: 'release',
    'pipeline-branches': 'pipeline-branch',
    presets: 'preset',
    webhooks: 'webhook',
    'access-tokens': 'access-token',
    tasks: 'task',
    collaborators: 'collaborator',
    stories: 'story',
} as const

const getJsonFiles = (dirPath: string): string[] => {
    if (!fs.existsSync(dirPath)) {
        return []
    }
    return fs.readdirSync(dirPath).filter((f: string) => f.endsWith('.json'))
}

export default async (token: string, spaceName: string, spaceId: string, passthroughArgs: string[] = []) => {
    const backupDir = path.join('.', 'storyblok-backups', spaceName)
    if (!fs.existsSync(backupDir)) {
        log.error(`Backup directory not found: ${backupDir}`)
        return
    }

    const restoreSpaceFile = async () => {
        const spaceFile = `space-${spaceId}.json`
        if (fs.existsSync(path.join(backupDir, spaceFile))) {
            await restoreFiles('space', backupDir, [spaceFile])
        }
    }

    const restoreFile = async (type: string, filePath: string, extraArgs: string[] = []) => {
        const result =
            await $`npx storyblok-restore --token ${token} --space ${spaceId} --type ${type} --file ${filePath} ${extraArgs} ${passthroughArgs}`
                .nothrow()
                .quiet()
        if (result.exitCode !== 0) {
            const createResult =
                await $`npx storyblok-restore --token ${token} --space ${spaceId} --type ${type} --file ${filePath} --create ${extraArgs} ${passthroughArgs}`
                    .nothrow()
                    .quiet()
            if (createResult.exitCode !== 0) {
                throw new Error(createResult.stderr)
            }
        }
    }

    const restoreFiles = async (
        type: string,
        dirPath: string,
        files: string[],
        argsForFile?: (file: string) => string[],
    ) => {
        for (const file of files) {
            log.step(`Restoring ${type}: ${file}`)
            try {
                await restoreFile(type, path.join(dirPath, file), argsForFile?.(file))
            } catch (error) {
                log.warn(`Failed to restore ${type} ${file}: ${error}`)
            }
        }
    }

    const restoreDatasources = async (dirPath: string, files: string[]) => {
        const mainFiles = files.filter((f) => !f.endsWith('_entries.json'))
        const entryFiles = files.filter((f) => f.endsWith('_entries.json'))

        await restoreFiles('datasource', dirPath, mainFiles)
        await restoreFiles('datasource-entries', dirPath, entryFiles, (file) => [
            '--id',
            file.replace('_entries.json', ''),
        ])
    }

    await restoreSpaceFile()

    for (const [folder, type] of Object.entries(restoreTypes)) {
        const dirPath = path.join(backupDir, folder)
        const files = getJsonFiles(dirPath)
        if (files.length === 0) {
            continue
        }

        if (folder === 'datasources') {
            await restoreDatasources(dirPath, files)
        } else {
            await restoreFiles(type, dirPath, files)
        }
    }
}
