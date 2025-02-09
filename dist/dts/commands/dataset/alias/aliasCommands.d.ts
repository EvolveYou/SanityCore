declare namespace _default {
    export const name: string;
    export const group: string;
    export const signature: string;
    export { helpText };
    export const description: string;
    export function action(args: any, context: any): Promise<void>;
}
export default _default;
declare const helpText: "\nBelow are examples of the alias subcommand\n\nCreate Alias\n  sanity dataset alias create\n  sanity dataset alias create <alias-name>\n  sanity dataset alias create <alias-name> <target-dataset>\n\nDelete Alias\n  sanity dataset alias delete <alias-name>\n\nLink Alias\n  Options\n    --force Skips security prompt and forces link command\n\n  Usage\n    sanity dataset alias link\n    sanity dataset alias link <alias-name>\n    sanity dataset alias link <alias-name> <target-dataset>\n\nUn-link Alias\n  sanity dataset alias unlink\n  sanity dataset alias unlink <alias-name>\n  sanity dataset alias unlink <alias-name> --force\n";
//# sourceMappingURL=aliasCommands.d.ts.map