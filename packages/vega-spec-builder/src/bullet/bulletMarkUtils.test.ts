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
import { GroupMark } from 'vega';

import {
  addAxes,
  addMarks,
  getBulletHoverArea,
  getBulletMarkLabel,
  getBulletMarkRect,
  getBulletMarkTarget,
  getBulletMarkTargetValueLabel,
  getBulletMarkThreshold,
  getBulletMarkValueLabel,
  getBulletTrack,
  getBulletValueText,
} from './bulletMarkUtils';
import { sampleOptionsColumn, sampleOptionsRow } from './bulletTestUtils';

describe('getBulletMarks', () => {
  test('Should return the correct marks object for column mode', () => {
    const data = addMarks([], sampleOptionsColumn)[0] as GroupMark;
    expect(data).toBeDefined;
    expect(data?.marks).toHaveLength(4);
    expect(data?.marks?.[0]?.type).toBe('rect');
    expect(data?.marks?.[1]?.type).toBe('rule');
    expect(data?.marks?.[2]?.type).toBe('text');
    expect(data?.marks?.[3]?.type).toBe('text');
    expect(Object.keys(data?.encode?.update || {})).toContain('y');
  });

  test('Should return the correct marks object for row mode', () => {
    const data = addMarks([], sampleOptionsRow)[0] as GroupMark;
    expect(data).toBeDefined;
    expect(data?.marks).toHaveLength(4);
    expect(data?.marks?.[0]?.type).toBe('rect');
    expect(data?.marks?.[1]?.type).toBe('rule');
    expect(data?.marks?.[2]?.type).toBe('text');
    expect(data?.marks?.[3]?.type).toBe('text');
    expect(Object.keys(data?.encode?.update || {})).toContain('x');
  });

  test('Should not include target marks when showTarget is false', () => {
    const options = { ...sampleOptionsColumn, showTarget: false, showTargetValue: true };
    const marksGroup = addMarks([], options)[0] as GroupMark;
    expect(marksGroup.marks).toHaveLength(3);
    marksGroup.marks?.forEach((mark) => {
      expect(mark.description).not.toContain('Target');
    });
  });

  test('Should include target value label when showTargetValue is true', () => {
    const options = { ...sampleOptionsColumn, showTarget: true, showTargetValue: true };
    const marksGroup = addMarks([], options)[0] as GroupMark;
    expect(marksGroup.marks).toHaveLength(5);
    const targetValueMark = marksGroup.marks?.find((mark) => mark.name?.includes('TargetValueLabel'));
    expect(targetValueMark).toBeDefined();
  });

  test('Should include label marks when axis labels are enabled', () => {
    const options = { ...sampleOptionsColumn, showTarget: true, showTargetValue: true };
    const marksGroup = addMarks([], options)[0] as GroupMark;
    expect(marksGroup.marks).toHaveLength(5);
    const targetValueMark = marksGroup.marks?.find((mark) => mark.name?.includes('TargetValueLabel'));
    expect(targetValueMark).toBeDefined();
  });

  test('Should include bullet track when track is set to true and threshold is set to false.', () => {
    const options = { ...sampleOptionsColumn, threshold: false, track: true };
    const marksGroup = addMarks([], options)[0] as GroupMark;
    expect(marksGroup.marks).toHaveLength(5);
    const bulletTrackMark = marksGroup.marks?.find((mark) => mark.name?.includes('Track'));
    expect(bulletTrackMark).toBeDefined();
    const bulletThresholdMark = marksGroup.marks?.find((mark) => mark.name?.includes('Threshold'));
    expect(bulletThresholdMark).toBeUndefined();
  });
});

describe('getBulletMarks() - tooltip support', () => {
  test('should include hover area mark when chartTooltips exist and thresholds are defined', () => {
    const marksGroup = addMarks([], {
      ...sampleOptionsColumn,
      chartTooltips: [{}],
      thresholds: [{ thresholdMax: 100, fill: 'red' }],
    })[0] as GroupMark;
    const hoverAreaMark = marksGroup.marks?.find((mark) => mark.name === 'bullet0HoverArea');
    expect(hoverAreaMark).toBeDefined();
    expect(hoverAreaMark?.type).toBe('rect');
    expect(hoverAreaMark?.interactive).toBe(true);
  });

  test('should include hover area mark when chartTooltips exist and track is enabled', () => {
    const marksGroup = addMarks([], {
      ...sampleOptionsColumn,
      chartTooltips: [{}],
      track: true,
    })[0] as GroupMark;
    const hoverAreaMark = marksGroup.marks?.find((mark) => mark.name === 'bullet0HoverArea');
    expect(hoverAreaMark).toBeDefined();
    expect(hoverAreaMark?.type).toBe('rect');
    expect(hoverAreaMark?.interactive).toBe(true);
  });

  test('should not include hover area mark when tooltips exist but no thresholds or track', () => {
    const marksGroup = addMarks([], {
      ...sampleOptionsColumn,
      chartTooltips: [{}],
      thresholds: [],
      track: false,
    })[0] as GroupMark;
    const hoverAreaMark = marksGroup.marks?.find((mark) => mark.name?.includes('HoverArea'));
    expect(hoverAreaMark).toBeUndefined();
  });

  test('should add tooltip to metric bar when tooltips are configured', () => {
    const marksGroup = addMarks([], {
      ...sampleOptionsColumn,
      chartTooltips: [{}],
    })[0] as GroupMark;
    const rectMark = marksGroup.marks?.find((mark) => mark.name === 'bullet0Rect');
    expect(rectMark?.interactive).toBe(true);
    expect(rectMark?.encode?.enter?.tooltip).toBeDefined();
  });

  test('should add tooltip to target line when tooltips are configured', () => {
    const marksGroup = addMarks([], {
      ...sampleOptionsColumn,
      chartTooltips: [{}],
      showTarget: true,
    })[0] as GroupMark;
    const targetMark = marksGroup.marks?.find((mark) => mark.name === 'bullet0Target');
    expect(targetMark?.interactive).toBe(true);
    expect(targetMark?.encode?.enter?.tooltip).toBeDefined();
  });

  test('should not include hover area mark when no tooltips exist', () => {
    const marksGroup = addMarks([], sampleOptionsColumn)[0] as GroupMark;
    const hoverAreaMark = marksGroup.marks?.find((mark) => mark.name?.includes('HoverArea'));
    expect(hoverAreaMark).toBeUndefined();
  });

  test('should render hover area mark last (on top) when thresholds exist', () => {
    const marksGroup = addMarks([], {
      ...sampleOptionsColumn,
      chartTooltips: [{}],
      thresholds: [{ thresholdMax: 100, fill: 'red' }],
      showTarget: true,
      showTargetValue: true,
    })[0] as GroupMark;
    const lastMark = marksGroup.marks?.[marksGroup.marks.length - 1];
    expect(lastMark?.name).toBe('bullet0HoverArea');
  });
});

describe('getBulletHoverArea()', () => {
  test('should return hover area mark with correct properties when thresholds exist', () => {
    const hoverArea = getBulletHoverArea({
      ...sampleOptionsColumn,
      thresholds: [{ thresholdMax: 100, fill: 'red' }],
      chartTooltips: [{}],
    });
    expect(hoverArea.name).toBe('bullet0HoverArea');
    expect(hoverArea.type).toBe('rect');
    expect(hoverArea.interactive).toBe(true);
    expect(hoverArea.encode?.enter?.fill).toEqual({ value: 'transparent' });
    expect(hoverArea.encode?.enter?.tooltip).toBeDefined();
  });

  test('should use targetHeight when thresholds exist and target is shown', () => {
    const hoverArea = getBulletHoverArea({
      ...sampleOptionsColumn,
      showTarget: true,
      thresholds: [{ thresholdMax: 100, fill: 'red' }],
      chartTooltips: [{}],
    });
    expect(hoverArea.encode?.update?.height).toEqual({ signal: 'targetHeight' });
  });

  test('should use bulletThresholdHeight when thresholds exist and no target', () => {
    const hoverArea = getBulletHoverArea({
      ...sampleOptionsColumn,
      showTarget: false,
      thresholds: [{ thresholdMax: 100, fill: 'red' }],
      chartTooltips: [{}],
    });
    expect(hoverArea.encode?.update?.height).toEqual({ signal: 'bulletThresholdHeight' });
  });

  test('should use bulletHeight when track exists (no thresholds)', () => {
    const hoverArea = getBulletHoverArea({
      ...sampleOptionsColumn,
      track: true,
      thresholds: [],
      chartTooltips: [{}],
    });
    expect(hoverArea.encode?.update?.height).toEqual({ signal: 'bulletHeight' });
  });

  test('should calculate correct y position when thresholds exist with target and target value', () => {
    const hoverArea = getBulletHoverArea({
      ...sampleOptionsColumn,
      showTarget: true,
      showTargetValue: true,
      thresholds: [{ thresholdMax: 100, fill: 'red' }],
      chartTooltips: [{}],
    });
    expect(hoverArea.encode?.update?.y).toEqual({ signal: 'bulletGroupHeight - targetValueLabelHeight - targetHeight' });
    expect(hoverArea.encode?.update?.height).toEqual({ signal: 'targetHeight' });
  });

  test('should calculate correct y position when thresholds exist without target but with target value', () => {
    const hoverArea = getBulletHoverArea({
      ...sampleOptionsColumn,
      showTarget: false,
      showTargetValue: true,
      thresholds: [{ thresholdMax: 100, fill: 'red' }],
      chartTooltips: [{}],
    });
    expect(hoverArea.encode?.update?.y).toEqual({ signal: 'bulletGroupHeight - targetValueLabelHeight - 3 - bulletThresholdHeight' });
    expect(hoverArea.encode?.update?.height).toEqual({ signal: 'bulletThresholdHeight' });
  });

  test('should calculate correct y position when track exists with target and target value', () => {
    const hoverArea = getBulletHoverArea({
      ...sampleOptionsColumn,
      track: true,
      showTarget: true,
      showTargetValue: true,
      thresholds: [],
      chartTooltips: [{}],
    });
    expect(hoverArea.encode?.update?.y).toEqual({ signal: 'bulletGroupHeight - 3 - 2 * bulletHeight - 20' });
    expect(hoverArea.encode?.update?.height).toEqual({ signal: 'bulletHeight' });
  });

  test('should use fallback values when no thresholds and no track', () => {
    const hoverArea = getBulletHoverArea({
      ...sampleOptionsColumn,
      track: false,
      thresholds: [],
      chartTooltips: [{}],
    });
    expect(hoverArea.encode?.update?.y).toEqual({ signal: 'bulletGroupHeight - 3 - 2 * bulletHeight' });
    expect(hoverArea.encode?.update?.height).toEqual({ signal: 'bulletHeight' });
  });

  test('should set correct x2 signal for column direction', () => {
    const hoverArea = getBulletHoverArea({
      ...sampleOptionsColumn,
      direction: 'column',
      thresholds: [{ thresholdMax: 100, fill: 'red' }],
      chartTooltips: [{}],
    });
    expect(hoverArea.encode?.update?.x2).toEqual({ signal: 'width' });
  });

  test('should set correct x2 signal for row direction', () => {
    const hoverArea = getBulletHoverArea({
      ...sampleOptionsColumn,
      direction: 'row',
      thresholds: [{ thresholdMax: 100, fill: 'red' }],
      chartTooltips: [{}],
    });
    expect(hoverArea.encode?.update?.x2).toEqual({ signal: 'bulletGroupWidth' });
  });
});

describe('getBulletMarkRect', () => {
  test('Should return the correct rect mark object', () => {
    const data = getBulletMarkRect(sampleOptionsColumn);
    expect(data).toBeDefined();
    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(4);
  });

  describe('getBulletMarkRect threshold color logic', () => {
    test('Uses barColor field when thresholdBarColor is enabled and thresholds exist', () => {
      const optionsWithThresholdColor = {
        ...sampleOptionsColumn,
        thresholdBarColor: true,
        thresholds: [
          { thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
          { thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
          { thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
        ],
      };
      const rectMark = getBulletMarkRect(optionsWithThresholdColor);
      expect(rectMark.encode?.enter?.fill).toEqual([{ field: 'barColor' }]);
    });

    test('Uses default color field when thresholdBarColor is disabled or no thresholds exist', () => {
      const optionsNoThresholds = { ...sampleOptionsColumn, thresholdBarColor: true, thresholds: [] };
      const rectMark = getBulletMarkRect(optionsNoThresholds);
      expect(rectMark.encode?.enter?.fill).toEqual([{ value: optionsNoThresholds.color }]);
    });

    test('Uses default color field when thresholdBarColor is disabled', () => {
      const optionsNoThresholds = {
        ...sampleOptionsColumn,
        thresholdBarColor: false,
        thresholds: [
          { thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
          { thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
          { thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
        ],
      };
      const rectMark = getBulletMarkRect(optionsNoThresholds);
      expect(rectMark.encode?.enter?.fill).toEqual([{ value: optionsNoThresholds.color }]);
    });

    test('Uses default color field when thresholdBarColor is disabled and no thresholds exist', () => {
      const optionsNoThresholds = { ...sampleOptionsColumn, thresholdBarColor: false, thresholds: [] };
      const rectMark = getBulletMarkRect(optionsNoThresholds);
      expect(rectMark.encode?.enter?.fill).toEqual([{ value: optionsNoThresholds.color }]);
    });
  });
});

describe('getBulletMarkTarget', () => {
  test('Should return the correct target mark object', () => {
    const data = getBulletMarkTarget(sampleOptionsColumn);
    expect(data).toBeDefined();
    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(3);
  });
});

describe('getBulletMarkLabel', () => {
  test('Should return the correct label mark object', () => {
    const data = getBulletMarkLabel(sampleOptionsColumn);
    expect(data).toBeDefined();
    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
  });
});

describe('getBulletMarkValueLabel', () => {
  test('Should return the correct value label mark object in column mode', () => {
    const data = getBulletMarkValueLabel(sampleOptionsColumn);
    expect(data).toBeDefined();
    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
  });

  describe('getBulletMarkValueLabel threshold color logic', () => {
    test('Label colour is always solidColor regardless of thresholdBarColor (fix for issue #701)', () => {
      const options = {
        ...sampleOptionsColumn,
        thresholdBarColor: true,
        thresholds: [{ thresholdMax: 200, fill: 'rgb(249, 137, 23)' }],
      };
      const labelMark = getBulletMarkValueLabel(options);
      // Label must NOT inherit datum.barColor — it must always be gray-900 (solidColor)
      expect(labelMark.encode?.enter?.fill).toEqual({ signal: "'rgb(0, 0, 0)'" });
    });

    test('Falls back to neutral when thresholdBarColor is false', () => {
      const options = { ...sampleOptionsColumn, thresholdBarColor: false };
      const labelMark = getBulletMarkValueLabel(options);
      expect(labelMark.encode?.enter?.fill).toEqual({ signal: "'rgb(0, 0, 0)'" });
    });

    test('Uses default color when no thresholds are provided', () => {
      const options = { ...sampleOptionsColumn, thresholdBarColor: true, thresholds: [] };
      const labelMark = getBulletMarkValueLabel(options);
      expect(labelMark.encode?.enter?.fill).toEqual({ signal: "'rgb(0, 0, 0)'" });
    });

    test('Uses default color when thresholdBarColor is false and no thresholds are provided', () => {
      const options = { ...sampleOptionsColumn, thresholdBarColor: false, thresholds: [] };
      const labelMark = getBulletMarkValueLabel(options);
      expect(labelMark.encode?.enter?.fill).toEqual({ signal: "'rgb(0, 0, 0)'" });
    });

    test('Uses default color when thresholdBarColor is true and no thresholds are provided', () => {
      const options = { ...sampleOptionsColumn, thresholdBarColor: true, thresholds: [] };
      const labelMark = getBulletMarkValueLabel(options);
      expect(labelMark.encode?.enter?.fill).toEqual({ signal: "'rgb(0, 0, 0)'" });
    });
  });
});

describe('getBulletMarkSideLabel', () => {
  test('Should not return label marks when side label mode is enabled', () => {
    const options = { ...sampleOptionsColumn, labelPosition: 'side' as 'side' | 'top' };
    const marks = addMarks([], options)[0] as GroupMark;
    expect(marks.marks).toBeDefined();
    expect(marks.marks).toHaveLength(2);
  });
});

describe('getBulletAxes', () => {
  test('Should return the correct axes object when side label mode is enabled', () => {
    const options = { ...sampleOptionsColumn, labelPosition: 'side' as 'side' | 'top' };
    const axes = addAxes([], options);
    expect(axes).toHaveLength(2);
    expect(axes[0].labelOffset).toBe(2);
  });

  test('Should return the correct axes object when side label mode is enabled and target label is shown', () => {
    const options = { ...sampleOptionsColumn, labelPosition: 'side' as 'side' | 'top', showTargetValue: true };
    const axes = addAxes([], options);
    expect(axes).toHaveLength(2);
    expect(axes[0].labelOffset).toBe(-8);
  });

  test('Should return an empty list when top label mode is enabled', () => {
    const axes = addAxes([], sampleOptionsColumn);
    expect(axes).toStrictEqual([]);
  });

  test('Should return the scale axis when axis is true, row mode is enabled, and showtarget is false', () => {
    const options = { ...sampleOptionsColumn, metricAxis: true };
    const axes = addAxes([], options);
    expect(axes).toStrictEqual([
      {
        labelOffset: 2,
        scale: 'xscale',
        orient: 'bottom',
        ticks: false,
        labelColor: 'gray',
        domain: false,
        tickCount: 5,
        offset: { signal: 'axisOffset' },
        encode: { labels: { update: { text: { signal: "(format(datum.value, ','))" } } } },
      },
    ]);
  });

  test('Should not return scale axis when showtarget and showtargetValue are true', () => {
    const options = { ...sampleOptionsColumn, showTarget: true, showTargetValue: true, axis: true };
    const axes = addAxes([], options);
    expect(axes).toStrictEqual([]);
  });
});

describe('Threshold functionality', () => {
  describe('Data generation', () => {
    test('Should add threshold data and mark when thresholds are provided', () => {
      const detailedThresholds = [
        { thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
        { thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
        { thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
      ];
      const options = { ...sampleOptionsRow, name: 'testBullet', thresholds: detailedThresholds };
      const marksGroup = addMarks([], options)[0] as GroupMark;
      expect(marksGroup.data).toBeDefined();
      expect(marksGroup.data?.[0].name).toBe('thresholds');
      const dataItem = marksGroup.data?.[0];
      expect(dataItem).toHaveProperty('values');
      const values = (dataItem as { values: unknown[] }).values;
      expect(values).toEqual(detailedThresholds);
      const thresholdMark = marksGroup.marks?.find((mark) => mark.name === `${options.name}Threshold`);
      expect(thresholdMark).toBeDefined();
    });
  });

  describe('Y encoding', () => {
    test('Should adjust y encoding when showTarget and showTargetValue is enabled', () => {
      const options = { ...sampleOptionsRow, name: 'testBullet', showTarget: true, showTargetValue: true };
      const thresholdMark = getBulletMarkThreshold(options);
      expect(thresholdMark.encode?.update?.y).toBeDefined();
      const yEncoding = thresholdMark.encode?.update?.y;
      if (yEncoding && 'signal' in yEncoding) {
        expect(yEncoding.signal).toBe('bulletGroupHeight - 3 - bulletThresholdHeight - targetValueLabelHeight');
      }
    });

    test('Should compute y encoding without subtracting targetValueLabelHeight when showTargetValue is false', () => {
      const options = { ...sampleOptionsRow, name: 'testBullet', showTarget: true, showTargetValue: false };
      const thresholdMark = getBulletMarkThreshold(options);
      const yEncoding = thresholdMark.encode?.update?.y;
      if (yEncoding && 'signal' in yEncoding) {
        expect(yEncoding.signal).not.toContain('targetValueLabelHeight');
        expect(yEncoding.signal).toBe('bulletGroupHeight - 3 - bulletThresholdHeight');
      }
    });
  });
});

describe('getBulletMarkTrack', () => {
  test('Should return the correct track mark object in column mode', () => {
    const options = { ...sampleOptionsColumn, name: 'testBullet', threshold: false, track: true };
    const data = getBulletTrack(options);
    expect(data).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(4);
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(5);
    expect(data.encode?.update?.width).toStrictEqual({ signal: 'width' });
  });

  test('Should return the correct track mark object in row mode', () => {
    const options = { ...sampleOptionsRow, name: 'testBullet', threshold: false, track: true };
    const data = getBulletTrack(options);
    expect(data.encode?.update?.width).toStrictEqual({ signal: 'bulletGroupWidth' });
  });

  test('Should return the correct track mark object when the target label is enabled', () => {
    const options = { ...sampleOptionsRow, name: 'testBullet', threshold: false, track: true, showTarget: true, showTargetValue: true };
    const data = getBulletTrack(options);
    expect(data.encode?.update?.y).toStrictEqual({ signal: 'bulletGroupHeight - 3 - 2 * bulletHeight - 20' });
  });
});

describe('getBulletValueText', () => {
  test('Should return production rules for shortNumber format', () => {
    const result = getBulletValueText('shortNumber', 'currentAmount');
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('test', "isNumber(datum['currentAmount'])");
    expect(result[0]).toHaveProperty('signal', "formatShortNumber(datum['currentAmount'])");
  });

  test('Should return production rules for standardNumber format', () => {
    const result = getBulletValueText('standardNumber', 'currentAmount');
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('test', "isNumber(datum['currentAmount'])");
    expect(result[0]).toHaveProperty('signal', "format(datum['currentAmount'], ',')");
  });
});
