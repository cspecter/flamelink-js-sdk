/**
 * This file only exists for UMD support for each of the Flamelink modules.
 * Rollup currently only supports inlining dynamic imports for UMD/AMD one level deep,
 * ie. it does not work referencing the dynamic import within the `@flamelink/sdk-content`
 * package.
 *
 * Once Rollup supports inlining for nested modules, we can remove this and simply import
 * the module package.
 */

import '@flamelink/sdk-content-cf'
import '@flamelink/sdk-content-rtdb'
