import { IInputs, IOutputs } from "./generated/ManifestTypes";

interface AccountEntity {
    accountid: string;
    name: string;
    accountnumber: string;
    rpc_accounttype?: number;
    "rpc_accounttype@OData.Community.Display.V1.FormattedValue"?: string;
    _msdyn_partyid_value?: string;
    _parentaccountid_value?: string;
}

export class AccountHierarchy implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _context: ComponentFramework.Context<IInputs> | undefined;
    private _container: HTMLDivElement | undefined;
    private _notifyOutputChanged: (() => void) | undefined;
    private _accounts: Record<string, AccountEntity> = {};
    private _tooltip: HTMLDivElement | undefined;

    constructor() {
        // Empty
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;
        this._container = container;
        container.classList.add("accountHierarchyContainer");

        this.loadAccounts();
    }


    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._context = context;
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }

    private loadAccounts(): void {
        if (!this._context) return;
        this._context.webAPI
            .retrieveMultipleRecords(
                "account",
                "?$select=accountid,name,accountnumber,rpc_accounttype,_msdyn_partyid_value,_parentaccountid_value&$top=50"
            )
            .then((result) => {
                this._accounts = {};
                result.entities.forEach((e: any) => {
                    this._accounts[e.accountid] = e as AccountEntity;
                });
                this.renderHierarchy();
            });
    }

    private renderHierarchy(): void {
        if (!this._container) return;
        this._container.innerHTML = "";
        const roots = Object.values(this._accounts).filter(
            (a) => !a._parentaccountid_value
        );
        roots.forEach((r) => {
            const node = this.createNode(r);
            this._container!.appendChild(node);
        });
    }

    private createNode(account: AccountEntity): HTMLElement {
        const wrapper = document.createElement("div");
        wrapper.classList.add("accountNode");
        wrapper.textContent = `${account.name} (${account.accountnumber}) - ${this.getAccountTypeLabel(account)}`;
        wrapper.onmouseenter = () => this.showAddress(account, wrapper);
        wrapper.onmouseleave = () => this.hideTooltip();

        const children = Object.values(this._accounts).filter(
            (a) => a._parentaccountid_value === account.accountid
        );
        if (children.length) {
            const container = document.createElement("div");
            container.classList.add("children");
            children.forEach((c) => container.appendChild(this.createNode(c)));
            wrapper.appendChild(container);
        }
        return wrapper;
    }

    private showAddress(account: AccountEntity, el: HTMLElement): void {
        if (!this._context) return;
        if (!this._tooltip) {
            this._tooltip = document.createElement("div");
            this._tooltip.classList.add("addressTooltip");
            this._container?.appendChild(this._tooltip);
        }
        this._tooltip.style.display = "block";
        this._tooltip.innerHTML = "Loading...";
        this.positionTooltip(el);

        if (!account._msdyn_partyid_value) {
            this._tooltip.innerHTML = "No party";
            return;
        }

        const filter = `?$select=msdyn_name,msdyn_street,msdyn_city,msdyn_state,msdyn_countryregionid,msdyn_zipcode&$filter=_msdyn_party_value eq ${account._msdyn_partyid_value}`;
        this._context.webAPI
            .retrieveMultipleRecords("msdyn_postaladdress", filter)
            .then((res) => {
                if (res.entities.length) {
                    const a = res.entities[0] as any;
                    this._tooltip!.innerHTML = `<strong>${a.msdyn_name}</strong><br>${a.msdyn_street}<br>${a.msdyn_city}, ${a.msdyn_state}<br>${a.msdyn_countryregionid} ${a.msdyn_zipcode}`;
                } else {
                    this._tooltip!.innerHTML = "No address found";
                }
            });
    }

    private positionTooltip(target: HTMLElement): void {
        if (!this._tooltip) return;
        const rect = target.getBoundingClientRect();
        this._tooltip.style.top = `${rect.bottom + 5}px`;
        this._tooltip.style.left = `${rect.left}px`;
    }

    private hideTooltip(): void {
        if (this._tooltip) {
            this._tooltip.style.display = "none";
        }
    }

    private getAccountTypeLabel(account: AccountEntity): string {
        return (
            account[
                "rpc_accounttype@OData.Community.Display.V1.FormattedValue"
            ] || ""
        );
    }
}
