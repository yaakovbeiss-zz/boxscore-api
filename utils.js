const parseFeed = (rawFeed) => {
    let parsedFeed = rawFeed
    if (rawFeed["game"]) {
        parsedFeed = rawFeed["game"]
    }

    return parsedFeed
}

module.exports = {
    parseFeed
}
