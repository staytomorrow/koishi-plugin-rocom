import { Context } from 'koishi';
export declare class Renderer {
    private resPath;
    constructor(resPath: string);
    private getTemplateRoot;
    private getTemplatePath;
    private getStylePath;
    renderHtml(ctx: Context, templateName: string, data: any): Promise<Buffer | null>;
}
