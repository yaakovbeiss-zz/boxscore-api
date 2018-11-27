const fetch = require("node-fetch");
const feeds = require("./feeds")
const Boxscore = require('./models')
const utils = require('./utils')


const FIFTEEN_SECONDS = 15000

const fetcher = async function(url) {
    try {
        const response = await fetch(url)
        const json = await response.json()
        return json
    } catch (err) {
        console.log("Error while fetching boxscore from feed: ", err)
    }
}

const getBoxscoreFromDbAsync = (gameId) => new Promise(function(resolve, reject) {
    Boxscore.findOne({gameId})
        .sort({created_at: -1})
        .exec(function(err, boxscore) {
            if (err) { reject(err) }
            // console.log("Boxscore from db: ", boxscore)
            resolve(boxscore)
        })
})

const createBoxscoreAsync = (data) => new Promise(function(resolve, reject) {
    const boxscore = new Boxscore(data);
    console.log("creating new boxscore with data: ", data)
    boxscore.save(function(err) {
        if (err) { console.log(err); }
        console.log("successfully created boxscore: ", boxscore)
        resolve(boxscore)
    });
});

const updateBoxscoreAsync = (gameId, data) => new Promise(function(resolve, reject) {
    console.log("updating new boxscore with data: ", data)
    // find record by latest game, there should never be more than one
    // boxscore per gameId in db
    Boxscore.findOneAndUpdate({gameId: gameId}, {$set: data}, {new: true}, (err, boxscore) => {
        if (err) { console.log("Error while updating boxscore") }
        resolve(boxscore)
    });
});

const getLatestBoxscore = async function(gameId) {
    // get latest boxscore from db by feedId
    const boxscore = await getBoxscoreFromDbAsync(gameId)
    const url = feeds[gameId]
    // If there is no boxscore in db, must be first time hitting
    // feed, therefore create (not update) new boxscore in db
    if (!boxscore) {
        let rawFeed = await fetcher(url)
        // parse feed to normalize data
        rawFeed = utils.parseFeed(rawFeed)

        // set gameId in db for future queries
        rawFeed['gameId'] = gameId
        const newBoxScore = await createBoxscoreAsync(rawFeed)
        console.log("newBoxScore: ", newBoxScore)
        return newBoxScore
    }

    // If status of boxscore is 'final' meaning the game is over,
    // do not fetch new boxscore from feed.
    if (boxscore['_doc']['status'] === "CLOSED") {
        return boxscore
    }

    // If boxscore hasn't been updated in 15 seconds get new boxscore
    // from feed and update boxscore in db with new raw feed
    const timeString = boxscore['_doc']['modifiedAt']
    const toDate = new Date(timeString)
    const modifiedAtInMilliSeconds = toDate.getTime()
    if ((Date.now() - modifiedAtInMilliSeconds) > FIFTEEN_SECONDS) {
        let rawFeed = await fetcher(url)
        const updatedBoxscore = await updateBoxscoreAsync(gameId, rawFeed)
        console.log("updatedBoxscore: ", updatedBoxscore)
        return updatedBoxscore
    }

    // else, return boxscore from db
    return boxscore
};

module.exports = {
    getLatestBoxscore
}
