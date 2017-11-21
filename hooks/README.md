Hooks
======

Integration layer for the WordPress hooks - a lightweight & efficient EventManager for JavaScript in WordPress.

### Usage

Within Gutenberg, these hooks can be accessed by importing from the `hooks` root directory:

```jsx
/**
 * WordPress dependencies
 */
import { addFitler } from '@wpcore/hooks';

addFilter( 'registerBlockType', 'core\anchor-attribute', settings => { ...settings, anchor: true } );
```

API functions can be also called via the global `wp.hooks` like this `wp.hooks.addAction()`, etc. More details can be found [in the official documentation](https://github.com/WordPress/packages/tree/master/packages/hooks).

