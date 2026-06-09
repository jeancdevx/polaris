module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        'infra'
      ]
    ],
    'scope-enum': [
      1,
      'always',
      [
        'backend',
        'lambdas',
        'web-admin',
        'mobile-app',
        'firmware',
        'iac',
        'deps',
        'config'
      ]
    ],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case']
    ],
    'header-max-length': [2, 'always', 100]
  }
}
