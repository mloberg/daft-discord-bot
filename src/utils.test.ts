import { escapeRegex } from './utils';

describe('escapeRegex', () => {
    it('escapes a string', () => {
        expect(escapeRegex('^f+o?o.b/a*r$')).toEqual('\\^f\\+o\\?o\\.b/a\\*r\\$');
        expect(escapeRegex('{(foo)[bar]}')).toEqual('\\{\\(foo\\)\\[bar\\]\\}');
    });
});
