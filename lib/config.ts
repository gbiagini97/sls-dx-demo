import { RemovalPolicy } from "aws-cdk-lib";

export const enum Region {
    frankfurt = "eu-central-1",
    london = "eu-west-2"
}

export const enum Stage {
    dev = "dev",
    test = "test",
    prod = "prod"
}

export interface DeployConfig {
    account: string;
    region: string;
    stage: string;
    removalPolicy: RemovalPolicy;
    testEnabled: boolean;
    autoRollback: boolean;
}

/**
 * Get deployment configuration based on branch name
 * - Feature branches deploy to dev account with branch name prefix
 * - test branch deploys to test account
 * - prod branch deploys to prod account
 */
export const getDeployConfig = (branchName: string): DeployConfig => {
    // Extract branch type (feature, bugfix, test, prod)
    const isBranchType = (prefix: string): boolean => {
        return branchName.startsWith(prefix + '/') || branchName === prefix;
    };

    // Test branch configuration
    if (branchName === Stage.test || isBranchType('release')) {
        return {
            account: "791918578647",
            region: Region.frankfurt,
            stage: Stage.test,
            removalPolicy: RemovalPolicy.RETAIN,
            testEnabled: true,
            autoRollback: true
        };
    }
    
    // Production configuration
    if (branchName === Stage.prod) {
        return {
            account: "164628550684",
            region: Region.frankfurt,
            stage: Stage.prod,
            removalPolicy: RemovalPolicy.RETAIN,
            testEnabled: true,
            autoRollback: true
        };
    }
    
    // Development configuration (default for feature branches)
    return {
        account: "027625171711",
        region: Region.frankfurt,
        stage: Stage.dev,
        removalPolicy: RemovalPolicy.DESTROY,
        testEnabled: false,
        autoRollback: false
    };
};

/**
 * Get logical ID prefix based on branch name
 * - For feature branches, use the branch name
 * - For test/prod branches, use the stage name
 */
export const getResourcePrefix = (branchName: string): string => {
    // For test and prod branches, use the stage name
    if (branchName === Stage.test || branchName === Stage.prod) {
        return branchName;
    }
    
    // For feature branches, sanitize the branch name
    // Replace invalid characters with dashes
    return branchName.replace(/[^a-zA-Z0-9-]/g, '-');
};
