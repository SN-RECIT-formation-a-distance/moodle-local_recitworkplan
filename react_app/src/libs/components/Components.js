//////////////////////////////////////////////////
// Note: the "export *" will only export the classes marqued with "export" in their definition
//////////////////////////////////////////////////

import "./css/components.scss";

export * from './ComboBox';
export * from './DataGrid';
export * from './Feedback';
export * from './InputNumber';
export * from './Loading';
export * from './ToggleButtons';
export * from './Modal';

export default class Components{
    static version = 1.0;

    static assets = {
        
    };
} 