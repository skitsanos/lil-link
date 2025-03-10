import {join} from 'path';

export default (req: Request): Response =>
{
    // server index.html from public folder

    const fileIndex = Bun.file(join(import.meta.dir, '..', '..', 'public', 'index.html'));

    return new Response(fileIndex.stream(), {
        headers: {
            'content-type': 'text/html'
        }
    });
}