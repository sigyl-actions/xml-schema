import { promises as fs } from 'fs';
import path from 'path'

import core from '@actions/core';
import github from '@actions/github';
import xsdValidator from 'xsd-validator';


async function run() {
  try {
    const regex = new RegExp(
      core.getInput('regex') || '^.+\.(([xX][mM][lL]))$' || '.',
    )
    const directory = core.getInput('path') || '.'
    
    fs.readFile(
      core.getInput('xsd') || 'test.xsd',
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
          ).map(
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
                if (result !== true) {
                  core.setFailed(`${filePath} failed validation: ${JSON.stringify(result)}`);
                }
              }
            )
        )
      )
    )
    .catch(
      (ex) => {
        core.setFailed(ex.message)
      },
    );
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
