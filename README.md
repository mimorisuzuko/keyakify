# Keyakify

Keyakify watches the update of your favorite keyakizaka 46 member's blog.

## Usage

### `new Keyakify(url: string)`

Create the instance.

If there is a update, fire the following event

### `keyakify.on('update:blog', (args) => {})`

#### `args`

* `url: string`
* `title: string`

### `keyakify.on('update:news', (args) => {})`

#### `args`

* `url: string`
* `content: string`
* `category: string`
* `date: Date`

### `keyakify.on('update:schedule', (args) => {})`

#### `args`

* `url: string`
* `content: string`
* `category: string`
* `date: Date`

Sample is [here](./sample).