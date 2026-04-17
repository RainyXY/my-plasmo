import { memo } from "react"

import { walletProviders } from "~store"

import { Nested } from "./Nested" // 引入

export const Root = memo(() => {
  return (
    <Nested components={walletProviders}>
      <HashRouter>
        <ErrorBoundary>
          <RenderRoutes />
        </ErrorBoundary>
      </HashRouter>
    </Nested>
  )
})
