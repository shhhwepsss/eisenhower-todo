export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'color-no-hex': true,
    'property-disallowed-list': ['cursor'],
    'selector-class-pattern': '^[a-z][a-zA-Z0-9]+$',
  },
  overrides: [
    { files: ['src/styles/_theme.scss'], rules: { 'color-no-hex': null } },
    {
      files: ['src/styles/tokens/_cursor.scss', 'src/styles/global.scss'],
      rules: { 'property-disallowed-list': null },
    },
  ],
};
