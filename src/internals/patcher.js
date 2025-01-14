import axios from 'axios';

export default () => {
    let blacklistedKeywords = ['cdn-cgi', 'jquery', 'jscolor'];
    let scripts = [...document.querySelectorAll('script')]
        .filter(script => !blacklistedKeywords.some(k => script.src.includes(k)))
        .filter(script => script.src.includes(location.host))
        .map(script => script.src);

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(async (node) => {
                    if (node.tagName === 'SCRIPT' && scripts.includes(node.src)) {
                        node.type = 'javascript/blocked';

                        try {
                            let { data } = await axios.get(node.src);

                            let filePatches = bb.patches.filter((e) => e.file === node.src.replace(location.origin, ''));

                            for (const patch of filePatches) for (const replacement of patch.replacement) {
                                if (replacement.condition && !replacement.condition()) continue;

                                const matchRegex = new RegExp(replacement.match, 'g');
                                if (!matchRegex.test(data)) {
                                    console.log(`Patch did nothing! Plugin: ${patch.plugin}; Regex: \`${replacement.match}\`.`);
                                    continue;
                                };

                                data = data.replaceAll(matchRegex, replacement.replace);
                            };

                            const url = URL.createObjectURL(new Blob([
                                `// ${node.src.replace(location.origin, '')}${filePatches.map(p => p.replacement).flat().length >= 1 ? ` - Patched by ${filePatches.map(p => p.plugin).join(', ')}` : ``}\n`,
                                data
                            ]));

                            node.type = 'text/javascript';
                            node.src = url;

                            console.log(`Patched '${node.src}'.`);
                        } catch (error) {
                            console.error(`Error patching ${node.src}, ignoring file.`, error);
                        };
                    };
                });
            }
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    document.head.insertAdjacentHTML('beforeend', `<style>${bb.plugins.styles.join('\n\n')}</style>`);

    /*
        Please do not remove this.

        Multiple mods often cause issues, often relating to hidden background scripts conflicting.
        In the case of Blacket++ and some other mods, we both directly modify the code of the game.
        This can cause conflicts and breakage, and neither mod will work.

        Be mindful what you do with our scripts.
    */

    setTimeout(() => {
        let mods = {
            'BetterBlacket v2': () => !!(window.pr || window.addCSS),
            'Flybird': () => !!window.gold,
            'Themeify': () => !!document.querySelector('#themifyButton'),
            'Blacket++': () => !!window.BPP
        };

        Object.entries(mods).forEach(mod => (mod[1]()) ? document.body.insertAdjacentHTML('beforeend', `
            <div class="arts__modal___VpEAD-camelCase" id="bigModal">
                <div class="bb_bigModal">
                    <div class="bb_bigModalTitle">External Mod Detected</div>
                    <div class="bb_bigModalDescription" style="padding-bottom: 1vw;">Our automated systems believe you are running the ${mod[0]} mod. We require that only BetterBlacket v3 is running. This prevents unneeded "IP abuse bans" from Blacket's systems.</div>
                </div>
            </div>
        `) : null);
    }, 5000);
};