import * as React from "react";
import * as ReactDOM from "react-dom";

import { QM, parse } from '../lib/qmreader';
import { QMPlayer, QMImages } from '../lib/qmplayer';

import { GamePlay } from './game';

import './gamelist.css';
import { Index, Game } from '../packGameData';
import { getBinary, getJson, DATA_DIR, INDEX_JSON, CACHE_NAME } from './common';

export const GAME_NAME = 'SpaceRangesGameName';
export const GAME_LIST_FILTER = 'SpaceRangesGameListFilter';


/*
interface ServiceWorkerRegistrationOptions {
	scope?: string;
}
interface ServiceWorkerContainer {
	controller?: ServiceWorker;
	oncontrollerchange?: (event?: Event) => any;
	onerror?: (event?: Event) => any;
	onmessage?: (event?: Event) => any;
	ready: Promise<ServiceWorkerRegistration>;
	getRegistration(scope?: string): Promise<ServiceWorkerRegistration>;
	getRegistrations(): Promise<Array<ServiceWorkerRegistration>>;
	register(url: string, options?: ServiceWorkerRegistrationOptions): Promise<ServiceWorkerRegistration>;
}
*/

const SHOW_ALLOWED_QUESTS = 500;



const PASSED_QUESTS = 'SpaceRangersPassedQuests';
const LANG = 'SpaceRangersLang';

async function loadGame(game: Game) {
    const data = await getBinary(DATA_DIR + game.filename, true)
    const qm = parse(new Buffer(data));
    const player = new QMPlayer(qm, game.images,
        game.filename.toLowerCase().endsWith('_eng.qm') ? 'eng' : 'rus',
        game.oldTgeBehaviour
    )
    return player
}
export class GameList extends React.Component<{
}, {
        gamePlaying?: {
            player: QMPlayer,
            gameName: string,
        },
        loading?: string,
        index?: Index,
        error?: string,
        passedQuestsGameNames: string[],
        lang: 'rus' | 'eng',
        serviceWorkerBusy: string | undefined,
        usedSpace: number | undefined,
    }> {
    constructor(props: any) {
        super(props);

        let passedQuestsGameNames: string[] = [];
        try {
            const fromLocal = localStorage.getItem(PASSED_QUESTS);
            if (fromLocal) {
                passedQuestsGameNames = JSON.parse(fromLocal)
            }
        } catch (e) {
            console.warn(`Unable to read stored pasesd quests`, e)
        };
        this.state = {
            passedQuestsGameNames,
            loading: 'Загрузка списка',
            index: undefined,
            error: undefined,
            lang: localStorage.getItem(LANG) !== 'eng' ? 'rus' : 'eng',
            serviceWorkerBusy: undefined,
            usedSpace: undefined,
        };
        (async () => {
            const index = await getJson(INDEX_JSON, true) as Index;
            this.setState({
                index
            })
            const runningGame = localStorage.getItem(GAME_NAME) || document.location.hash.replace(/^#/, '');
            if (runningGame) {
                const game = this.quests.find(x => x.gameName === runningGame);
                if (game) {
                    this.setState({
                        loading: `${this.state.lang === 'rus' ? 'Загрузка' : 'Loading'} ${game.gameName}`
                    })
                    const player = await loadGame(game);
                    this.setState({
                        gamePlaying: {
                            player,
                            gameName: game.gameName,
                        },
                        loading: undefined
                    })
                    return;
                }
            }

            document.location.hash = "";
            this.setState({
                loading: undefined
            })
        })().catch(e => {
            console.info(e);
            this.setState({ error: `Ошибка: ${e.message}` })
        })
    }

    private spaceTimer: number | undefined;
    private updateUsedSpace() {
        if ('webkitTemporaryStorage' in navigator) {
            (navigator as any).webkitTemporaryStorage.queryUsageAndQuota((used: number, remaining: number) => {
                // console.log(new Date() + " Used quota: " + used + ", remaining quota: " + remaining);
                this.setState({
                    usedSpace: used
                })
            }, (e: Error) => {
                console.log('Error', e);
            });
        }
    }
    componentDidMount() {
        this.updateUsedSpace();
    }
    componentWillUnmount() {
        if (this.spaceTimer) {
            clearInterval(this.spaceTimer);
        }
    }
    get quests() {
        if (!this.state.index) {
            return []
        } else {
            return this.state.index.quests.filter(x => x.lang === this.state.lang)
        }
    };
    render() {
        const currentSelectedOrigin = localStorage.getItem(GAME_LIST_FILTER);
        if (!this.state.gamePlaying) {
            const allQuests = this.quests
            .filter(q => !currentSelectedOrigin || q.questOrigin === currentSelectedOrigin)
            .map((game, index) => {
                const passed = this.state.passedQuestsGameNames.indexOf(game.gameName) > -1 ?
                    (this.state.lang === 'rus' ? 'Пройден' : 'Passed') : '';
                const disabled = (this.state.passedQuestsGameNames.length + SHOW_ALLOWED_QUESTS) <= index || this.state.loading;
                return <a key={game.filename} href={"#" + game.gameName} id={'gamelist_' + game.gameName}
                    className={"list-group-item list-group-item-action flex-column align-items-start " +
                        (disabled ? 'disabled' : '')}
                    title={disabled ? "Нужно пройти предыдущие" : ''}
                    onClick={e => {
                        e.preventDefault();
                        if (disabled) {
                            return;
                        }
                        this.setState({
                            loading: `${this.state.lang === 'rus' ? 'Загрузка' : 'Loading'} ${game.gameName}`
                        })
                        loadGame(game).then(player => {
                            this.setState({
                                loading: undefined
                            })
                            if (player) {
                                this.setState({
                                    gamePlaying: {
                                        player,
                                        gameName: game.gameName
                                    }
                                })
                            }
                        }).catch(e => {
                            console.info(e);
                            this.setState({ error: `Ошибка: ${e.message}` })
                        })
                    }}
                >
                    <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">{game.gameName}</h5>
                        <small>{passed}</small>
                    </div>
                    <p className="mb-1"><span className="gamelist-maxheight">{game.description || ''}</span></p>
                    <small>{game.smallDescription || ''}</small>
                </a>
            })
            const mainView = this.state.error ? <div className='text-warning'>{this.state.error}</div> :
                this.state.loading ? <div
                    className="gamelist-saving">{this.state.loading}<span>.</span><span>.</span><span>.</span></div> :
                    <div className="list-group">
                        {allQuests}
                    </div>



            /*
            navigator.webkitTemporaryStorage.queryUsageAndQuota(function(used, remaining) {
              console.log("Used quota: " + used + ", remaining quota: " + remaining);
            }, function(e) {
              console.log('Error', e); 
            } );
            
            navigator.webkitPersistentStorage.queryUsageAndQuota(webkitStorageInfo.TEMPORARY,             
            function(used, remaining) {
              console.log("Used quota: " + used + ", remaining quota: " + remaining);
            }, function(e) {
              console.log('Error', e); 
            } );
            


            self.addEventListener('message', function(event){
                console.log("SW Received Message: " + event.data);
            });
            function send_message_to_sw(msg){
                navigator.serviceWorker.controller.postMessage("Client 1 says '"+msg+"'");
            }


            */
            // navigator.serviceWorker.getRegistration().then(r => r.unregister()).then(x => console.info(x))
            // navigator.serviceWorker.controller
            const serviceWorker = 'serviceWorker' in navigator ? <li className='nav-item'>
                <a className={"nav-link " + (this.state.serviceWorkerBusy ? "disabled" : "")} href="#" onClick={e => {
                    e.preventDefault();
                    if (this.state.serviceWorkerBusy) {
                        return;
                    }
                    this.setState({
                        serviceWorkerBusy: 'Wait'
                    }, () => {
                        if (!navigator.serviceWorker.controller) {
                            this.spaceTimer = setInterval(() => {
                                this.updateUsedSpace()
                            }, 1000) as any;
                            this.setState({
                                serviceWorkerBusy: 'Unregistering old'
                            })
                            console.info(`Starting to install service worker`);
                            navigator.serviceWorker.getRegistration()
                                .then(r => r && r.unregister())
                                .then(() => {
                                    this.setState({
                                        serviceWorkerBusy: 'Registering'
                                    })
                                    return navigator.serviceWorker.register('serviceWorker.js')
                                })
                                .then(registration => {
                                    this.setState({
                                        serviceWorkerBusy: 'Registered'
                                    })
                                    console.log('ServiceWorker registration successful with scope: ',
                                        registration.scope);

                                    registration.onupdatefound = () => {
                                        console.info('onupdatefound')
                                        this.setState({
                                            serviceWorkerBusy: 'Downloading'
                                        })
                                        const installingWorker = registration.installing;
                                        if (installingWorker) {
                                            installingWorker.onstatechange = () => {
                                                console.info(`New state = ${installingWorker.state}`)
                                                this.setState({
                                                    serviceWorkerBusy: `SW state: ${installingWorker.state}`
                                                })
                                                if (installingWorker.state === 'activated') {
                                                    this.setState({
                                                        serviceWorkerBusy: 'Reloading'
                                                    })
                                                    setTimeout(() => {
                                                        location.reload();
                                                    }, 3000);
                                                } else if (installingWorker.state === 'redundant') {
                                                    this.setState({
                                                        serviceWorkerBusy: 'Reloading (SW redundant)'
                                                    })
                                                    setTimeout(() => {
                                                        location.reload();
                                                    }, 3000);
                                                }
                                            };
                                        } else {
                                            console.error(`Can not find installing sw`);
                                            this.setState({
                                                serviceWorkerBusy: 'Error: no installing SW'
                                            })
                                            setTimeout(() => {
                                                location.reload();
                                            }, 3000);
                                        }
                                    };

                                }, err => {
                                    // registration failed :(
                                    console.log('ServiceWorker registration failed: ', err);
                                    document.location.reload();
                                });
                        } else {
                            this.setState({
                                serviceWorkerBusy: 'Uninstalling'
                            }, async () => {
                                console.info(`Starting to uninstall service worker`);
                                const r = await navigator.serviceWorker.getRegistration();
                                if (!r) {
                                    console.warn('No registration!')
                                    return
                                } else {
                                    console.info(`Got registration`)
                                }
                                await r.unregister();
                                console.info(`Cleaning cache`)
                                await window.caches.delete(CACHE_NAME);
                                console.info(`Reloading page`);
                                document.location.reload();                                
                            })
                        }
                    })
                }}>{this.state.serviceWorkerBusy ||
                    (navigator.serviceWorker.controller ? 'Uninstall' : 'Install')}{this.state.usedSpace ?
                        ' [used ' + Math.round(this.state.usedSpace / 1000000).toString() + 'mb]' : ''}</a>
            </li> : null;

            return <div>
                <nav className=
                    "navbar navbar-toggleable navbar-inverse bg-inverse">
                    <button
                        className="navbar-toggler navbar-toggler-right"
                        type="button" data-toggle="collapse" data-target="#navbarsExampleDefault"
                        aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <a className="navbar-brand" href="#">{
                        this.state.lang === 'rus' ? 'Квесты' :
                            'Quests'
                    }</a>

                    <div className="collapse navbar-collapse" id="navbarsExampleDefault">
                        <ul className="navbar-nav mr-auto">

                        <li className="nav-item dropdown">
        <a className="nav-link dropdown-toggle" 
          href="#" id="navbarDropdownMenuLink" 
          data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            {currentSelectedOrigin || (this.state.lang === 'rus' ? 'Все' : 'All')}
        </a>

        <div className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
          <a className="dropdown-item" href="#" onClick={e => {
              e.preventDefault();
              localStorage.setItem(GAME_LIST_FILTER, '');
              this.forceUpdate();
          }}>{this.state.lang === 'rus' ? 'Все' : 'All'}</a>
          {this.quests.map(x => x.questOrigin)
            .reduce((acc, d) => acc.indexOf(d) > -1  ? acc : acc.concat(d), [] as string[])
            .map(origin => {
                return <a key={origin} className="dropdown-item" href="#"
                onClick={e => {
                    e.preventDefault();
              localStorage.setItem(GAME_LIST_FILTER, origin);
              this.forceUpdate();
                }}
                >{origin}</a>
            })}
          
          
        </div>
      </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#" onClick={e => {
                                    e.preventDefault();
                                    const newLang = this.state.lang === 'rus' ? 'eng' : 'rus'
                                    this.setState({
                                        lang: newLang
                                    });
                                    localStorage.setItem(LANG, newLang);
                                }}>{this.state.lang === 'rus' ? 'English' : 'Русский'}</a>
                            </li>
                            {serviceWorker}
                        </ul>
                    </div>
                </nav>

                <div className="jumbotron">
                    <div className="container">
                        {mainView}
                    </div>
                </div>

                <footer className="footer">
		    <div className="pt-2 pb-1 px-1">
                        <p className="text-center"><a href="https://github.com/roginvs/space-rangers-quest">https://github.com/roginvs/space-rangers-quest</a></p>
		    </div>
                </footer>
            </div >
        } else {
            return <GamePlay {...this.state.gamePlaying}
                lang={this.state.lang}
                musicList={this.state.index ? this.state.index.dir.music.files.map(x => x.path) : []}
                onPassed={() => {
                    if (this.state.gamePlaying) {
                        if (this.state.passedQuestsGameNames.indexOf(this.state.gamePlaying.gameName) < 0) {
                            const newList = this.state.passedQuestsGameNames.concat(this.state.gamePlaying.gameName);
                            this.setState({
                                passedQuestsGameNames: newList
                            })
                            localStorage.setItem(PASSED_QUESTS, JSON.stringify(newList));
                        }
                    }
                    //asdasd
                }}
                onReturn={(gameName) => {
                    this.setState({
                        gamePlaying: undefined
                    }, () => {
                        const e = document.getElementById('gamelist_' + gameName);
                        if (e) {
                            e.scrollIntoView();
                        }
                    })
                    localStorage.setItem(GAME_NAME, '')
                }}
            />
        }
    }
}
