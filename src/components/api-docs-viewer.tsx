'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export function ApiDocsViewer() {
  return <SwaggerUI url="/openapi.yaml" />;
}
