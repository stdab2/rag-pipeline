export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore']],
        'scope-enum': [2, 'always', ['web', 'api', 'root', 'deps']],
        'scope-empty': [2, 'never'],
        'header-max-length': [2, 'always', 100],
        'subject-case': [2, 'always', 'lower-case'],
    }
}