class ServiceNotFoundError extends Error {
  constructor(service: string) {
    super(`service [${service}] not found.`);
    this.name = 'ServiceNotFoundError';
  }
}

export { ServiceNotFoundError };
