/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { produce } from 'immer';
import { Axis, GroupMark, Mark, TextValueRef } from 'vega';

import { getColorValue } from '@spectrum-charts/themes';

import { getTooltip } from '../marks/markUtils';
import { getTextNumberFormat } from '../textUtils';
import { BulletSpecOptions } from '../types';

export const addMarks = produce<Mark[], [BulletSpecOptions]>((marks, bulletOptions) => {
  const markGroupEncodeUpdateDirection = bulletOptions.direction === 'column' ? 'y' : 'x';
  const bulletGroupWidth = bulletOptions.direction === 'column' ? 'width' : 'bulletGroupWidth';

  const bulletMark: GroupMark = {
    name: 'bulletGroup',
    type: 'group',
    from: {
      facet: { data: 'table', name: 'bulletGroups', groupby: `${bulletOptions.dimension}` },
    },
    encode: {
      update: {
        [markGroupEncodeUpdateDirection]: { scale: 'groupScale', field: `${bulletOptions.dimension}` },
        height: { signal: 'bulletGroupHeight' },
        width: { signal: bulletGroupWidth },
      },
    },
    marks: [],
  };

  const thresholds = bulletOptions.thresholds;

  if (Array.isArray(thresholds) && thresholds.length > 0) {
    bulletMark.data = [
      {
        name: 'thresholds',
        values: thresholds,
        transform: [{ type: 'identifier', as: 'id' }],
      },
    ];
    bulletMark.marks?.push(getBulletMarkThreshold(bulletOptions));
  } else if (bulletOptions.track) {
    bulletMark.marks?.push(getBulletTrack(bulletOptions));
  }

  bulletMark.marks?.push(getBulletMarkRect(bulletOptions));
  if (bulletOptions.target && bulletOptions.showTarget !== false) {
    bulletMark.marks?.push(getBulletMarkTarget(bulletOptions));
    if (bulletOptions.showTargetValue) {
      bulletMark.marks?.push(getBulletMarkTargetValueLabel(bulletOptions));
    }
  }

  if (bulletOptions.labelPosition === 'top' || bulletOptions.direction === 'row') {
    bulletMark.marks?.push(getBulletMarkLabel(bulletOptions));
    bulletMark.marks?.push(getBulletMarkValueLabel(bulletOptions));
  }

  const hasThresholds = Array.isArray(bulletOptions.thresholds) && bulletOptions.thresholds.length > 0;
  const hasTrack = bulletOptions.track === true;

  if (bulletOptions.chartTooltips?.length && (hasThresholds || hasTrack)) {
    bulletMark.marks?.push(getBulletHoverArea(bulletOptions));
  }

  marks.push(bulletMark);
});

export function getBulletMarkRect(bulletOptions: BulletSpecOptions): Mark {
  const bulletMarkRectEncodeUpdateYSignal =
    bulletOptions.showTarget && bulletOptions.showTargetValue
      ? 'bulletGroupHeight - targetValueLabelHeight - 3 - 2 * bulletHeight'
      : 'bulletGroupHeight - 3 - 2 * bulletHeight';

  const fillColor =
    bulletOptions.thresholdBarColor && (bulletOptions.thresholds?.length ?? 0) > 0
      ? [{ field: 'barColor' }]
      : [{ value: bulletOptions.color }];

  const bulletMarkRect: Mark = {
    name: `${bulletOptions.name}Rect`,
    description: `${bulletOptions.name}Rect`,
    type: 'rect',
    from: { data: 'bulletGroups' },
    interactive: true,
    encode: {
      enter: {
        cornerRadiusTopLeft: [{ test: `datum.${bulletOptions.metric} < 0`, value: 3 }],
        cornerRadiusBottomLeft: [{ test: `datum.${bulletOptions.metric} < 0`, value: 3 }],
        cornerRadiusTopRight: [{ test: `datum.${bulletOptions.metric} > 0`, value: 3 }],
        cornerRadiusBottomRight: [{ test: `datum.${bulletOptions.metric} > 0`, value: 3 }],
        fill: fillColor,
        tooltip: getTooltip(bulletOptions.chartTooltips ?? [], bulletOptions.name),
      },
      update: {
        x: { scale: 'xscale', value: 0 },
        x2: { scale: 'xscale', field: `${bulletOptions.metric}` },
        height: { signal: 'bulletHeight' },
        y: { signal: bulletMarkRectEncodeUpdateYSignal },
      },
    },
  };

  return bulletMarkRect;
}

export function getBulletMarkTarget(bulletOptions: BulletSpecOptions): Mark {
  const solidColor = getColorValue('gray-900', bulletOptions.colorScheme);

  const bulletMarkTargetEncodeUpdateY =
    bulletOptions.showTarget && bulletOptions.showTargetValue
      ? 'bulletGroupHeight - targetValueLabelHeight - targetHeight'
      : 'bulletGroupHeight - targetHeight';
  const bulletMarkTargetEncodeUpdateY2 =
    bulletOptions.showTarget && bulletOptions.showTargetValue
      ? 'bulletGroupHeight - targetValueLabelHeight'
      : 'bulletGroupHeight';

  const bulletMarkTarget: Mark = {
    name: `${bulletOptions.name}Target`,
    description: `${bulletOptions.name}Target`,
    type: 'rule',
    from: { data: 'bulletGroups' },
    interactive: true,
    encode: {
      enter: {
        stroke: { value: `${solidColor}` },
        strokeWidth: { value: 2 },
        tooltip: getTooltip(bulletOptions.chartTooltips ?? [], bulletOptions.name),
      },
      update: {
        x: { scale: 'xscale', field: `${bulletOptions.target}` },
        y: { signal: bulletMarkTargetEncodeUpdateY },
        y2: { signal: bulletMarkTargetEncodeUpdateY2 },
      },
    },
  };

  return bulletMarkTarget;
}

export function getBulletMarkLabel(bulletOptions: BulletSpecOptions): Mark {
  const barLabelColor = getColorValue('gray-600', bulletOptions.colorScheme);

  const bulletMarkLabel: Mark = {
    name: `${bulletOptions.name}Label`,
    description: `${bulletOptions.name}Label`,
    type: 'text',
    from: { data: 'bulletGroups' },
    encode: {
      enter: {
        text: { signal: `datum.${bulletOptions.dimension}` },
        align: { value: 'left' },
        baseline: { value: 'top' },
        fill: { value: `${barLabelColor}` },
      },
      update: { x: { value: 0 }, y: { value: 0 } },
    },
  };

  return bulletMarkLabel;
}

export function getBulletValueText(
  numberFormat: string,
  datumProperty: string
): ({ test?: string } & TextValueRef)[] {
  const textRules = getTextNumberFormat(numberFormat || 'standardNumber', datumProperty);
  return [...textRules];
}

export function getBulletMarkValueLabel(bulletOptions: BulletSpecOptions): Mark {
  const defaultColor = getColorValue(bulletOptions.color, bulletOptions.colorScheme);
  const solidColor = getColorValue('gray-900', bulletOptions.colorScheme);
  const encodeUpdateSignalWidth = bulletOptions.direction === 'column' ? 'width' : 'bulletGroupWidth';
  // Value label colour is always solidColor (gray-900) regardless of thresholdBarColor.
  // thresholdBarColor controls bar fill only — not the label text.
  // See: https://github.com/adobe/react-spectrum-charts/issues/701
  const fillExpr = `'${solidColor}'`;

  const textValue = bulletOptions.metricLabel
    ? [{ field: bulletOptions.metricLabel }]
    : getBulletValueText(bulletOptions.numberFormat || 'standardNumber', bulletOptions.metric);

  const bulletMarkValueLabel: Mark = {
    name: `${bulletOptions.name}ValueLabel`,
    description: `${bulletOptions.name}ValueLabel`,
    type: 'text',
    from: { data: 'bulletGroups' },
    encode: {
      enter: {
        text: textValue,
        align: { value: 'right' },
        baseline: { value: 'top' },
        fill: { signal: fillExpr },
      },
      update: { x: { signal: encodeUpdateSignalWidth }, y: { value: 0 } },
    },
  };

  return bulletMarkValueLabel;
}

export function getBulletMarkTargetValueLabel(bulletOptions: BulletSpecOptions): Mark {
  const solidColor = getColorValue('gray-900', bulletOptions.colorScheme);
  const valueExpr = `datum.${bulletOptions.target}`;

  const textSignal = bulletOptions.targetLabel
    ? `${valueExpr} != null ? 'Target: ' + datum.${bulletOptions.targetLabel} : 'No Target'`
    : `${valueExpr} != null ? 'Target: ' + (${buildFormatSignal(valueExpr, bulletOptions.numberFormat || 'standardNumber')}) : 'No Target'`;

  const bulletMarkTargetValueLabel: Mark = {
    name: `${bulletOptions.name}TargetValueLabel`,
    description: `${bulletOptions.name}TargetValueLabel`,
    type: 'text',
    from: { data: 'bulletGroups' },
    encode: {
      enter: {
        text: { signal: textSignal },
        align: { value: 'center' },
        baseline: { value: 'top' },
        fill: { value: `${solidColor}` },
      },
      update: {
        x: { scale: 'xscale', field: `${bulletOptions.target}` },
        y: { signal: 'bulletGroupHeight - targetValueLabelHeight + 6' },
      },
    },
  };

  return bulletMarkTargetValueLabel;
}

export function getBulletMarkThreshold(bulletOptions: BulletSpecOptions): Mark {
  const baseHeightSignal = 'bulletGroupHeight - 3 - bulletThresholdHeight';
  const encodeUpdateYSignal =
    bulletOptions.showTarget && bulletOptions.showTargetValue
      ? `${baseHeightSignal} - targetValueLabelHeight`
      : baseHeightSignal;

  const bulletMarkThreshold: Mark = {
    name: `${bulletOptions.name}Threshold`,
    description: `${bulletOptions.name}Threshold`,
    type: 'rect',
    from: { data: 'thresholds' },
    clip: true,
    encode: {
      enter: {
        cornerRadiusTopLeft: [{ test: `!isDefined(datum.thresholdMin) && domain('xscale')[0] !== 0`, value: 3 }],
        cornerRadiusBottomLeft: [{ test: `!isDefined(datum.thresholdMin) && domain('xscale')[0] !== 0`, value: 3 }],
        cornerRadiusTopRight: [{ test: `!isDefined(datum.thresholdMax) && domain('xscale')[1] !== 0`, value: 3 }],
        cornerRadiusBottomRight: [{ test: `!isDefined(datum.thresholdMax) && domain('xscale')[1] !== 0`, value: 3 }],
        fill: { field: 'fill' },
        fillOpacity: { value: 0.2 },
      },
      update: {
        x: { signal: "isDefined(datum.thresholdMin) ? scale('xscale', datum.thresholdMin) : 0" },
        x2: { signal: "isDefined(datum.thresholdMax) ? scale('xscale', datum.thresholdMax) : width" },
        height: { signal: 'bulletThresholdHeight' },
        y: { signal: encodeUpdateYSignal },
      },
    },
  };
  return bulletMarkThreshold;
}

function getHoverAreaSignalsForThresholds(options: BulletSpecOptions): { y: string; height: string } {
  if (options.showTarget) {
    const y = options.showTargetValue
      ? 'bulletGroupHeight - targetValueLabelHeight - targetHeight'
      : 'bulletGroupHeight - targetHeight';
    return { y, height: 'targetHeight' };
  }
  const y = options.showTargetValue
    ? 'bulletGroupHeight - targetValueLabelHeight - 3 - bulletThresholdHeight'
    : 'bulletGroupHeight - 3 - bulletThresholdHeight';
  return { y, height: 'bulletThresholdHeight' };
}

function getHoverAreaSignalsForTrack(options: BulletSpecOptions): { y: string; height: string } {
  const y =
    options.showTarget && options.showTargetValue
      ? 'bulletGroupHeight - 3 - 2 * bulletHeight - 20'
      : 'bulletGroupHeight - 3 - 2 * bulletHeight';
  return { y, height: 'bulletHeight' };
}

export function getBulletHoverArea(bulletOptions: BulletSpecOptions): Mark {
  const hasThresholds = Array.isArray(bulletOptions.thresholds) && bulletOptions.thresholds.length > 0;
  const hasTrack = bulletOptions.track === true;

  let signals: { y: string; height: string };
  if (hasThresholds) {
    signals = getHoverAreaSignalsForThresholds(bulletOptions);
  } else if (hasTrack) {
    signals = getHoverAreaSignalsForTrack(bulletOptions);
  } else {
    signals = { y: 'bulletGroupHeight - 3 - 2 * bulletHeight', height: 'bulletHeight' };
  }

  const x2Signal = bulletOptions.direction === 'column' ? 'width' : 'bulletGroupWidth';

  return {
    name: `${bulletOptions.name}HoverArea`,
    description: `hover area for ${bulletOptions.name}`,
    type: 'rect',
    from: { data: 'bulletGroups' },
    interactive: true,
    encode: {
      enter: {
        fill: { value: 'transparent' },
        tooltip: getTooltip(bulletOptions.chartTooltips ?? [], bulletOptions.name),
      },
      update: {
        x: { value: 0 },
        x2: { signal: x2Signal },
        height: { signal: signals.height },
        y: { signal: signals.y },
      },
    },
  };
}

export function getBulletTrack(bulletOptions: BulletSpecOptions): Mark {
  const trackColor = getColorValue('gray-200', bulletOptions.colorScheme);
  const trackWidth = bulletOptions.direction === 'column' ? 'width' : 'bulletGroupWidth';
  const trackY =
    bulletOptions.showTarget && bulletOptions.showTargetValue
      ? 'bulletGroupHeight - 3 - 2 * bulletHeight - 20'
      : 'bulletGroupHeight - 3 - 2 * bulletHeight';

  const bulletTrack: Mark = {
    name: `${bulletOptions.name}Track`,
    description: `${bulletOptions.name}Track`,
    type: 'rect',
    from: { data: 'bulletGroups' },
    encode: {
      enter: {
        fill: { value: trackColor },
        cornerRadiusTopRight: [{ test: "domain('xscale')[1] !== 0", value: 3 }],
        cornerRadiusBottomRight: [{ test: "domain('xscale')[1] !== 0", value: 3 }],
        cornerRadiusTopLeft: [{ test: "domain('xscale')[0] !== 0", value: 3 }],
        cornerRadiusBottomLeft: [{ test: "domain('xscale')[0] !== 0", value: 3 }],
      },
      update: {
        x: { value: 0 },
        width: { signal: trackWidth },
        height: { signal: 'bulletHeight' },
        y: { signal: trackY },
      },
    },
  };

  return bulletTrack;
}

export function getBulletLabelAxesLeft(labelOffset): Axis {
  return {
    scale: 'groupScale',
    orient: 'left',
    tickSize: 0,
    labelOffset: labelOffset,
    labelPadding: 10,
    labelColor: '#797979',
    domain: false,
  };
}

function buildFormatSignal(valueExpr: string, numberFormat: string): string {
  if (numberFormat === 'shortNumber') return `formatShortNumber(${valueExpr})`;
  if (numberFormat === 'shortCurrency')
    return String.raw`abs(${valueExpr}) >= 1000 ? upper(replace(format(${valueExpr}, '$.3~s'), /(\d+)G/, '$1B')) : format(${valueExpr}, '$')`;
  if (numberFormat === 'currency') return `format(${valueExpr}, '$,.2f')`;
  if (numberFormat === 'standardNumber') return `format(${valueExpr}, ',')`;
  return `format(${valueExpr}, '${numberFormat}')`;
}

export function getBulletLabelAxesRight(bulletOptions: BulletSpecOptions, labelOffset): Axis {
  const valueExpr = `info(data('table')[datum.index * (length(data('table')) - 1)].${bulletOptions.metric})`;
  const textSignal = bulletOptions.metricLabel
    ? `data('table')[datum.index * (length(data('table')) - 1)].${bulletOptions.metricLabel}`
    : `${valueExpr} != null ? (${buildFormatSignal(valueExpr, bulletOptions.numberFormat || 'standardNumber')}) : ''`;

  return {
    scale: 'groupScale',
    orient: 'right',
    tickSize: 0,
    labelOffset: labelOffset,
    labelPadding: 10,
    domain: false,
    encode: { labels: { update: { text: { signal: textSignal } } } },
  };
}

export function getBulletScaleAxes(bulletOptions: BulletSpecOptions): Axis {
  const formatSignal = buildFormatSignal('datum.value', bulletOptions.numberFormat || 'standardNumber');
  return {
    labelOffset: 2,
    scale: 'xscale',
    orient: 'bottom',
    ticks: false,
    labelColor: 'gray',
    domain: false,
    tickCount: 5,
    offset: { signal: 'axisOffset' },
    encode: { labels: { update: { text: { signal: `(${formatSignal})` } } } },
  };
}

export const addAxes = produce<Axis[], [BulletSpecOptions]>((axes, bulletOptions) => {
  if (bulletOptions.metricAxis && bulletOptions.direction === 'column' && !bulletOptions.showTargetValue) {
    axes.push(getBulletScaleAxes(bulletOptions));
  }
  if (bulletOptions.labelPosition === 'side' && bulletOptions.direction === 'column') {
    const labelOffset = bulletOptions.showTargetValue && bulletOptions.showTarget ? -8 : 2;
    axes.push(getBulletLabelAxesLeft(labelOffset), getBulletLabelAxesRight(bulletOptions, labelOffset));
  }
});
