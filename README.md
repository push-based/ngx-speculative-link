# NgxSpeculativeLink

An Angular implementation of [Speculative Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API) 
inspired by [quicklink](https://github.com/GoogleChromeLabs/quicklink) and [ngx-quicklink](https://github.com/mgechev/ngx-quicklink).

**IMPORTANT**
This is currently in its discovery phase, there will be changes to the underlining implementation and its APIs.

## How it works

NgxSpeculativeLink attempts so improve the performance of future navigation with preloading, prefetching and pre-rendering. 

Under the hood it uses an IntersectionObserver to identify which links are in the viewport and are potential future navigations.
Then using pattern matching we identify the routes connected to the link, preload the routes and execute a preResolverFunction when it enters the viewport.

## Usage

Provide the Speculative Link Preloading Strategy to the router:

```ts
export const appConfig: ApplicationConfig = {
    providers: [
        // ... other providers
        provideRouter(appRoutes, withSpeculativeLinkPreloading()),
    ],
};
```

Add Speculative Link Functionality to an element:

```html
<a href='/path' speculativeLink='/home'></a>
```

Add preResolver functionality to a route:

```ts
const route: Route = {
    path: ':event',
    data: {
        preResolver: (linkData: PreResolver) => {
            // Executed in the injection context of the route or the root
            inject(HomeResolver).preloadData(linkData);
        }
    }
}
```
