const chalk = require('chalk');
const webpack = require('./compiler');
const ansiEscapes = require('ansi-escapes');
const readline = require('readline');

let isSub = false;
const generateSingleOption = option => {
    const { key, description } = option;
    const optionString = chalk.gray('> Press') + ` ${chalk.bold.white(key)} ` + chalk.gray(`${description}\n`);
    return optionString;
};
const generateConfigDescription = config => {
    let configDescString = '\n';
    const headerString = chalk.bold.white('Interactive Usage');
    configDescString += headerString;
    configDescString += '\n';
    Object.keys(config).forEach(option => {
        configDescString += generateSingleOption(config[option]);
    });
    configDescString += '\n';
    return configDescString;
};

const setupInteractive = () => {
    const usagePrompt = generateConfigDescription(interactiveConfig);
    console.clear();
    console.log(usagePrompt);
};

const informActions = () => {
    console.log('You can now analyze your build, press c to continue...\n');
};

const writeFilterConsole = () => {
    if (state.length) {
        const latestCompilation = state[state.length - 1];
        let data = [];

        for (let i = 0; i < latestCompilation.chunks.length; i++) {
            const name = latestCompilation.chunks[i].id;
            let chunksArr = [];
            for (let j = 0; j < latestCompilation.chunks[i].modules.length; j++) {
                const size = latestCompilation.chunks[i].modules[j].size;
                const path = latestCompilation.chunks[i].modules[j].name.replace('./', '');
                const issuerPath = latestCompilation.chunks[i].modules[j].issuerPath;
                chunksArr.push({ path, size, issuerPath });
            }
            data.push({ [name]: chunksArr });
        }
        console.clear();
        const orangeline = chalk.keyword('orange');
        data.forEach((chunk, idx) => {
            Object.keys(chunk).forEach(mod => {
                console.log(chalk.bold.cyan(mod));
                chunk[mod].forEach(sub => {
                    console.log('> ', orangeline(sub.path));
                });
            });
        });
        process.stdout.write(ansiEscapes.cursorTo(0, 1));
    }
};

let state = [];
let interactiveConfig = [
    {
        key: 'a',
        description: 'Analyze build for performance improvements',
        onShowMore: [],
    },
    {
        key: 'p',
        description: 'Pause compilation at a given time',
        onShowMore: [],
    },
    {
        key: 'm',
        description: 'Filter a module and get stats on why a module was included',
        onShowMore: [],
    },
    {
        key: 'Enter',
        description: 'Run webpack',
        onShowMore: [],
    },
    {
        key: 'q',
        description: 'Exit interactive mode',
        onShowMore: [],
    },
];

let backMenuOption = {
    key: 'b',
    description: 'Go back to main menu',
};

const EXIT_KEY = 'q';
const ANALYZE_KEY = 'a';
const FILTER_KEY = 'm';
const ENTER_KEY = '\n';
const B_KEY = 'b';
const C_KEY = 'c';

module.exports = async function(config, outputOptions, processingErrors) {
    const stdin = process.stdin;
    stdin.setEncoding('utf-8');
    stdin.setRawMode(true);
    readline.emitKeypressEvents(stdin);

    outputOptions.interactive = false;

    const webpackCompilation = await webpack({ options: config, outputOptions, processingErrors });
    /* if(errors) {
	Hngggg
} */
    state.push(webpackCompilation);
    setupInteractive();

    const isExitCtrl = key => key.ctrl && key.name === 'c';

    stdin.on('keypress', (str, key) => {
        stdin.setRawMode(true);
        if (isExitCtrl(key)) {
            console.clear();
            process.exit();
        } else if (key.name === 'down') {
            process.stdout.write(ansiEscapes.cursorNextLine);
        } else if (key.name === 'up') {
            process.stdout.write(ansiEscapes.cursorPrevLine);
        } else if (key.name === 'return') {
            // TODO: get line and do stuff
        }
    });

    stdin.on('data', async function(data) {
        if (isSub === true) {
            console.log(data, 'yo');
            return;
        }
        switch (data) {
            case C_KEY:
                setupInteractive();
                break;
            case EXIT_KEY:
                console.log('exit');
                process.exit(0);
            case ANALYZE_KEY:
                console.log('analyzing modules');
                break;
            case FILTER_KEY:
                isSub = true;
                writeFilterConsole();
                break;
            case B_KEY:
                console.clear();
                stdin.setEncoding('utf-8');
                setupInteractive();
                break;
            case ENTER_KEY:
                console.clear();
                console.log('Running webpack');
                if (state.length) {
                    state.pop();
                }
                const webpackCompilation = await webpack({ options: config, outputOptions, processingErrors });
                state.push(webpackCompilation);
                informActions();
                isSub = true;
                return;
            default:
                break;
        }
    });
};
