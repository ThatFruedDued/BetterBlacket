class Storage {
    storage = {};

    constructor() {
        Object.entries(localStorage).forEach(([key, value]) => this.storage[key] = value);
    };

    refresh = () => {
        Object.keys(localStorage).forEach((key) => delete localStorage[key]);
        Object.entries(this.storage).forEach(([key, value]) => localStorage.setItem(key, value));
        return this.storage;
    };

    get = (key, parse)=> {
        if (parse) return JSON.parse(this.storage[key]);
        return this.storage[key];
    };

    set = (key, value, stringify) => {
        if (stringify) this.storage[key] = JSON.stringify(value);
        else this.storage[key] = value;
        return this.refresh();
    };

    remove = (key) => {
        delete this.storage[key];
        return this.refresh();
    };

    clear = () => {
        this.storage = {};
        return this.refresh();
    };

    all = () => this.storage;
};

const storage = new Storage();
export default storage;