    remote+local setConfigBoth
    local setConfigLocal,
    local getConfigLocal,

    local isGamePassedLocal,
    remote+local setGamePassing,
      - updateFirebaseOwnHighscore

    remote getFirebasePublicHighscores,

    local saveGame,
    local getLocalSaving,
    // getAllRemoteSavings,

    remote->local syncWithFirebase
      - config
      - passed games
      - updateFirebaseOwnHighscore
      - setOwnHighscoresName

    setOwnHighscoresName
