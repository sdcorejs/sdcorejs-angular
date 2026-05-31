/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module paste-from-office/pastefromoffice
 */

import { Plugin, ClipboardPipeline } from 'ckeditor5';

import { PasteFromOfficeMSWordNormalizer } from './normalizers/mswordnormalizer';
import { GoogleDocsNormalizer } from './normalizers/googledocsnormalizer';
import { GoogleSheetsNormalizer } from './normalizers/googlesheetsnormalizer';

import { parsePasteOfficeHtml } from './filters/parse';
import type { PasteFromOfficeNormalizer, PasteFromOfficeNormalizerData } from './types';

/**
 * The Paste from Office plugin.
 *
 * This plugin handles content pasted from Office apps and transforms it (if necessary)
 * to a valid structure which can then be understood by the editor features.
 *
 * Transformation is made by a set of predefined {@link module:paste-from-office/normalizer~PasteFromOfficeNormalizer normalizers}.
 * This plugin includes following normalizers:
 * * {@link module:paste-from-office/normalizers/mswordnormalizer~PasteFromOfficeMSWordNormalizer Microsoft Word normalizer}
 * * {@link module:paste-from-office/normalizers/googledocsnormalizer~GoogleDocsNormalizer Google Docs normalizer}
 *
 * For more information about this feature check the {@glink api/paste-from-office package page}.
 */
export class PasteHandler extends Plugin {
  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'PasteHandler' as const;
  }

  /**
   * @inheritDoc
   */
  public static get requires() {
    return [ClipboardPipeline] as const;
  }

  /**
   * @inheritDoc
   */
  public init(): void {
    const editor = this.editor;
    const clipboardPipeline: ClipboardPipeline = editor.plugins.get('ClipboardPipeline');
    const viewDocument = editor.editing.view.document;
    const normalizers: Array<PasteFromOfficeNormalizer> = [];
    const hasMultiLevelListPlugin = this.editor.plugins.has('MultiLevelListEditing');
    const hasTablePropertiesPlugin = this.editor.plugins.has('TablePropertiesEditing');
    const hasExtendedTableBlockAlignment = true; // In CKEditor 5 v48, extended table block alignment is stable and enabled by default.

    normalizers.push(
      new PasteFromOfficeMSWordNormalizer(viewDocument, hasMultiLevelListPlugin, hasTablePropertiesPlugin, hasExtendedTableBlockAlignment)
    );
    normalizers.push(new GoogleDocsNormalizer(viewDocument));
    normalizers.push(new GoogleSheetsNormalizer(viewDocument));

    clipboardPipeline.on(
      'inputTransformation',
      (evt, data: PasteFromOfficeNormalizerData) => {
        if (data._isTransformedWithPasteFromOffice) {
          return;
        }

        const codeBlock = editor.model.document.selection.getFirstPosition()!.parent;

        if (codeBlock.is('element', 'codeBlock')) {
          return;
        }

        const htmlString = data.dataTransfer.getData('text/html');
        const activeNormalizer = normalizers.find(normalizer => normalizer.isActive(htmlString));

        if (activeNormalizer) {
          if (!data._parsedData) {
            data._parsedData = parsePasteOfficeHtml(htmlString, viewDocument.stylesProcessor);
          }

          activeNormalizer.execute(data);

          data._isTransformedWithPasteFromOffice = true;
        }
      },
      { priority: 'high' }
    );
  }
}
