const { promises: fs } = require('fs');
const path = require('path')

const core = require('@actions/core');
const xsdValidator = require('xsd-validator');


async function run() {
  try {
    process.chdir(core.getInput('schema_path'));
    const regex = new RegExp(
      core.getInput('regex') || '.',
    )
    const directory = core.getInput('folder') || '.'
    
    fs.readFile(
      core.getInput('xsd'),
    )
    .then(
      (file) => file.toString(),
    )
    .then(
      (xsd) => fs.readdir(
        directory,
        { withFileTypes: true },
      )
      .then(
        (dirents) => dirents
          .filter(
            (dirent) => dirent.isFile(),
          )
          .map(
            ({
              name,
            }) => name,
          )
      )
      .then(
        (files) => Promise.all(
          files.filter(
            (file) => file.match(regex)
          ).map(
            (file) => path.join(
              directory,
              file,
            ),
          )
          .map(
            (filePath) => fs.readFile(
              filePath
            ).then(
              (buffer) => ({
                filePath,
                xml: buffer.toString(),
              }),
            ),
          )
        ).then(
          (xmls) => xmls
            .map(
              ({
                filePath,
                xml,
              }) => {
                try {
                  return ({
                    result: xsdValidator.default(
                      xml,
                      xsd,
                    ),
                    filePath,
                  })
                } catch(ex) {
                  return ({
                    result: false,
                    error: ex.message,
                    filePath,
                  })
                }
              },
            ),
        )
        .then(
          (results) => {
            core.setOutput('result', JSON.stringify(results))
            if (results.find(({ result }) => result !== true)) {
              core.setOutput("error", true);
            } else {
              core.setOutput("error", false);
            }
          },
        )
      )
    )
    .catch(
      (ex) => {
        core.setOutput('error', ex.message)
        // core.setFailed(ex.message)
      },
    );
  }
  catch (error) {
    console.error(error.message)
    core.setFailed(error.message);
  }
}

run()
