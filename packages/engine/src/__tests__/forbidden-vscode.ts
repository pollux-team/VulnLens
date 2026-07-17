// Path remap target so accidental `import 'vscode'` in engine fails clearly at typecheck.
throw new Error('packages/engine must not import vscode')
