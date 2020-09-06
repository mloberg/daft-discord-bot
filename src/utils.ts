export function env(key: string, _default: string): string {
    return process.env[key] ?? _default;
}
