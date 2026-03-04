import { Logger } from '../../core/logger/logger';

const logger = new Logger();

function someNewFeature() {
    logger.warn('This is a warning message from the new feature.');
}

someNewFeature();
