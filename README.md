# AccountHierarchy

This PCF control displays a hierarchy of accounts. Each node shows the account name, number and account type. When hovering over a node, the related postal address is retrieved and displayed as a tooltip.

### Features

- Fetches account records using the Web API and builds a tree based on the parent account relationship.
- Shows the label of the `rpc_accounttype` option set.
- On mouse hover the control retrieves the party and postal address to show `msdyn_name`, `msdyn_street`, `msdyn_city`, `msdyn_state`, `msdyn_countryregionid` and `msdyn_zipcode`.
- UI elements use `rgb(40, 116, 252)` for styling.

### Development

Install dependencies and build:

```bash
npm install
npm run build
```
