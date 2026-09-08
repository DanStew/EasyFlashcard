/**
 * Computes class names for the StudyStage container
 */
export function getStudyStageClassNames(isFocusMode: boolean = false): string {
  const classes = ['study-stage'];
  if (isFocusMode) {
    classes.push('study-stage--focus');
  }
  return classes.join(' ');
}
