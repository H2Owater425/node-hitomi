import hitomi from'./library/index';

async function main() : Promise<void> {
    let page = 1

    console.log(await hitomi.getIds({
        startIndex: (page - 1) * 25,
        endIndex: (page - 1) * 25 + 24
    }));

    page = 2;

    console.log(await hitomi.getIds({
        startIndex: (page - 1) * 25,
        endIndex: (page - 1) * 25 + 24
    }));   
}

main();