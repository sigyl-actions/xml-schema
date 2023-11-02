const { promises: fs } = require('fs');
const path = require('path')

const core = require('@actions/core');
const xsdValidator = require('xsd-validator');


async function run() {
  try {
    console.log(__dirname);
    console.log(core.getInput('schema_path'));
    process.chdir(core.getInput('schema_path'));
    const regex = new RegExp(
      core.getInput('regex') || '^.+\.(([xX][mM][lL]))$' || '.',
    )
    const directory = core.getInput('folder') || '.'
    
    fs.readFile(
      core.getInput('xsd') || 'test2.xsd',
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
        (files) => console.log(files) || files,
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
          ).map(
            (filePath) => console.log(filePath) || filePath,
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
                  console.log(ex.message);
                  throw new Error(
                    `error parsing xml or xsd for ${filePath} ${JSON.stringify(ex)}`,
                  )
                }
              },
            ),
        )
        .then(
          (results) => results
            .forEach(
              ({
                filePath,
                result,
              }) => {
                console.log({ filePath, result });
                if (result !== true) {
                  core.setOutput('error', JSON.stringify({ filePath, result }));          
                  core.setFailed(`${filePath} failed validation: ${JSON.stringify(result)}`);
                }
              }
            )
        )
      )
    )
    .catch(
      (ex) => {
        core.setOutput('error', ex.message)
        core.setFailed(ex.message)
      },
    );
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
