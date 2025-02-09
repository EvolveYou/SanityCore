declare namespace _default {
    export const name: string;
    export const group: string;
    export const description: string;
    export const action: any;
    export { helpText };
}
export default _default;
declare const helpText: "\nOptions\n  --dataset <dataset> Delete GraphQL API for the given dataset\n  --tag <tag> Delete GraphQL API for the given tag (defaults to 'default')\n  --force Skip confirmation prompt, forcefully undeploying the GraphQL API\n\nExamples\n  sanity graphql undeploy\n  sanity graphql undeploy --dataset staging\n  sanity graphql undeploy --dataset staging --tag next\n  sanity graphql undeploy --dataset staging --force\n";
//# sourceMappingURL=deleteGraphQLAPICommand.d.ts.map