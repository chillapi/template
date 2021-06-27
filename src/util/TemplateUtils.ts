import { createHash } from "crypto";
import { existsSync } from "fs";
import { mkdir, writeFile, readFile, rm } from "fs/promises";
import { dirname } from "path";
import Handlebars from "handlebars";

export async function executeTemplate(fPath: string, fTpl: string, args: any): Promise<void> {
    const dir = dirname(fPath);

    if (!existsSync(dir)) {
        try {
            await mkdir(dir, { recursive: true });
        } catch (err) {
            console.error(err);
            return Promise.reject(err);
        }
    }
    const f = Handlebars.templates[fTpl];

    if (!f) {
        return Promise.reject(`Template not found: ${fTpl}`);
    }

    try {
        await writeFile(fPath, f(args), 'utf-8');
    } catch (err) {
        console.error(err);
        return Promise.reject(err);
    }
    return Promise.resolve();
}

export async function executeTemplateIfTargetNotEditedByUser(fPath: string, fTpl: string, args: any): Promise<void> {
    // If the file does not exist yet, it's okay to create it
    if (!existsSync(fPath)) {
        console.info(`Processing template ${fTpl}.`)
        return executeTemplate(fPath, fTpl, args);
    }

    const checksumPath = `${fPath}.checksum`;

    // If there is no checksum, we can assume the file was already created manually by the user
    if (!existsSync(checksumPath)) {
        console.info(`No checksum found for ${fPath}. Assuming the file was created manually, will not overwrite`);
        return Promise.resolve();
    }
    let fileContent;
    let checksum;
    let fileChecksum;

    try {
        console.info(`Verifying checksum from ${checksumPath}.`);

        fileContent = (await readFile(fPath)).toString();
        checksum = (await readFile(checksumPath)).toString();

        fileChecksum = createHash('md5').update(fileContent).digest("hex");
    } catch (err) {
        return Promise.reject(err);
    }

    if (checksum !== fileChecksum) {
        console.info(`Checksum for ${fPath} is different from generated file, will not overwrite a file that was manually edited`);
        return Promise.resolve();
    }

    try {
        console.info(`Updating file ${fPath} and writing new checksum ${checksumPath}.`)
        await rm(fPath);
        await rm(checksumPath);
        await executeTemplate(fPath, fTpl, args);
        fileContent = (await readFile(fPath)).toString();
        checksum = createHash('md5').update(fileContent).digest("hex");
        await writeFile(checksumPath, checksum);
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }

}
