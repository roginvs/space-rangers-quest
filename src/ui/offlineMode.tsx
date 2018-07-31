import * as React from "react";
import { Loader, DivFadeinCss } from "./common";
import { LangTexts } from "./lang";
import { Container } from "reactstrap";

import { observer } from 'mobx-react';
import { Store } from './store';

@observer
export class OfflineModeTabContainer extends React.Component<
    {
        store: Store
    },
    {}
> {
    render() {
        const store = this.props.store;
        return (            
            <DivFadeinCss key="offlinemode" className="text-center container my-3">            
            <div>serviceWorkerController={store.serviceWorkerController}</div>
            <div>persistent={`${store.serviceWorkerStoragePersistent}`}</div>
            <div>haveInstallingServiceWorker={store.haveInstallingServiceWorker}</div>
            <div>haveWaitingServiceWorker={store.haveWaitingServiceWorker}</div>
            <div>haveActiveServiceWorker={store.haveActiveServiceWorker}</div>
            </DivFadeinCss>            
        )
    }
}