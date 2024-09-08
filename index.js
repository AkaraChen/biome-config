#!/usr/bin/env node

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import { consola } from 'consola';
import { ensureDependencyInstalled } from 'nypm';
import { Octokit } from 'octokit';

const cwd = process.cwd();

if (fs.existsSync(path.join(cwd, 'biome.json'))) {
    const ok = confirm(
        'biome.json already exists. Do you want to overwrite it?',
    );
    if (!ok) {
        consola.error('Aborted');
        process.exit(0);
    }
}

consola.info('Ensuring biome is installed...');
await ensureDependencyInstalled('@biomejs/biome', { dev: true });

consola.info('Fetching biome.json from GitHub...');
const octokit = new Octokit();
const res = await octokit.request('GET /gists/{gist_id}', {
    gist_id: 'b1418ff566587b45008851ac6158e030',
    headers: {
        'X-GitHub-Api-Version': '2022-11-28',
    },
});
consola.info('biome.json fetched successfully');

const content = res.data.files['biome.json'].content;
await fsp.writeFile(path.join(cwd, 'biome.json'), content);
consola.success('biome.json created successfully');

consola.info('Writing package.json script...');
const packageJson = JSON.parse(
    await fsp.readFile(path.join(cwd, 'package.json'), 'utf-8'),
);
await fsp.writeFile(
    path.join(cwd, 'package.json'),
    JSON.stringify(
        {
            ...packageJson,
            scripts: {
                ...packageJson.scripts,
                check: 'biome check . --write',
            },
        },
        null,
        2,
    ),
);
