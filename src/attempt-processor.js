
import Constants from './constants';
import HttpClient from './http-client';
import Irt from './irt';
import LearnerManager from './learner-manager';
import ModelManager from './model-manager';
import State from './state';
import Utils from './utils';

class KidaptiveSdkAttemptProcessor {
  /**
   * Prepares an attempt for processAttempt by validating the object and defining missing prior values
   * This function is a private function within the SDK called when events with attempts are processed
   * 
   * @param {object} attempt
   *   The attempt object to be prepared
   *
   * @return
   *   The updated attempt object, or undefined if something went wrong
   */
  prepareAttempt(attempt) {
    //copy atttempt
    const updatedAttempt = Utils.copyObject(attempt);

    //check if learner is set
    const learnerId = State.get('learnerId');
    if (learnerId == null) {
      //log a warning
      if (Utils.checkLoggingLevel('warn') && console && console.log) {
        console.log('Warning: processAttempt called with no active learner selected. Attempt is discarded.');       
      }
      return;
    }

    //validate attempt is an object
    if (!Utils.isObject(attempt)) {
      //log a warning
      if (Utils.checkLoggingLevel('warn') && console && console.log) {
        console.log('Warning: processAttempt called with a non object attempt. Attempt will be discarded.');       
      }
      return;
    }

    //validate item uri is a string
    if (!Utils.isString(attempt.itemURI)) {
      //log a warning
      if (Utils.checkLoggingLevel('warn') && console && console.log) {
        console.log('Warning: processAttempt called with a non string itemUri. Attempt will be discarded.');       
      }
      return
    }

    //validate guessing paramter is a number
    if (attempt.guessingParameter != null &&  !Utils.isNumber(attempt.guessingParameter)) {
      //log a warning
      if (Utils.checkLoggingLevel('warn') && console && console.log) {
        console.log('Warning: processAttempt called with a non numeric guessingParamter. Attempt will be discarded.');       
      }
      return
    }

    //validate outcome is a number
    if (!Utils.isNumber(attempt.outcome)) {
      //log a warning
      if (Utils.checkLoggingLevel('warn') && console && console.log) {
        console.log('Warning: processAttempt called with  a non numeric outcome. Attempt will be discarded.');       
      }
      return
    }

    //get item
    const item = ModelManager.getItemByUri(attempt.itemURI);

    //if item doesn't exist, or item dimension / localDimension, something went wrong
    if (!item || !item.localDimension || !item.localDimension.dimension) {
      //log a warning
      if (Utils.checkLoggingLevel('warn') && console && console.log) {
        console.log('Warning: processAttempt called with an invalid itemUri. Attempt will be discarded.');       
      }
      return;
    }

    //get models
    const latentAbility = LearnerManager.getLatentAbilityEstimate(item.localDimension.dimension.uri);
    const localAbility = LearnerManager.getLocalAbilityEstimate(item.localDimension.uri);

    //add prior values
    updatedAttempt.priorLatentMean = latentAbility.mean;
    updatedAttempt.priorLatentStandardDeviation = latentAbility.standardDeviation;
    updatedAttempt.priorLocalMean = localAbility.mean;
    updatedAttempt.priorLocalStandardDeviation = localAbility.standardDeviation;

    //return
    return updatedAttempt;
  }

  /**
   * Process an attempt for the current learner
   * This function is a private function within the SDK called when events with attempts are processed
   * 
   * @param {object} attempt
   *   The attempt object to be processed
   */
  processAttempt(attempt) {
    //get learner
    const learnerId = State.get('learnerId');

    //get models
    const item = ModelManager.getItemByUri(attempt.itemURI);

    //process data in IRT to get new ability
    const estimation = Irt.estimate(attempt.outcome, item.mean, attempt.guessingParameter, attempt.priorLocalMean, attempt.priorLocalStandardDeviation);

    //set new ability values
    const newAbility = {
      dimension: item.localDimension.dimension,
      mean: estimation.post_mean,
      standardDeviation: estimation.post_sd,
      timestamp: State.get('trialTime') || 0
    };

    //setup variables to update abilities based off of latent abilities
    const newAbilities = State.get('latentAbilities.' + learnerId) || [];

    //if the ability already exists, replace it in the array
    const updateAbilityIndex = Utils.findItemIndex(newAbilities, newAbility => newAbility.dimension && (newAbility.dimension.uri === item.localDimension.dimension.uri));
    if (updateAbilityIndex !== -1) {
      newAbilities[updateAbilityIndex] = newAbility;

    //if ability doesn't exist, push new ability onto array
    } else {
      newAbilities.push(newAbility);
    }

    //update latentAbilities in state
    State.set('latentAbilities.' + learnerId, newAbilities);

    //update latentAbilities in cache
    Utils.cacheLatentAbilityEstimates(newAbilities);
  }
}

export default new KidaptiveSdkAttemptProcessor();
