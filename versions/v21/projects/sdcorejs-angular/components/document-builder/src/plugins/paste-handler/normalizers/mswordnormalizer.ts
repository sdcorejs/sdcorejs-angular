/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module paste-from-office/normalizers/mswordnormalizer
 */

import { transformBookmarks } from '../filters/bookmark';
import { transformListItemLikeElementsIntoLists } from '../filters/list';
import { replaceImagesSourceWithBase64 } from '../filters/image';
import { removeMSAttributes } from '../filters/removemsattributes';
import { transformTables } from '../filters/table';
import { removeInvalidTableWidth } from '../filters/removeinvalidtablewidth';
import { replaceMSFootnotes } from '../filters/replacemsfootnotes';
import { ViewUpcastWriter, type ViewDocument } from 'ckeditor5';
import type { PasteFromOfficeNormalizer, PasteFromOfficeNormalizerData } from '../types';

const msWordMatch1 = /<meta\s*name="?generator"?\s*content="?microsoft\s*word\s*\d+"?\/?>/i;
const msWordMatch2 = /xmlns:o="urn:schemas-microsoft-com/i;

/**
 * Normalizer for the content pasted from Microsoft Word.
 */
export class PasteFromOfficeMSWordNormalizer implements PasteFromOfficeNormalizer {
  public readonly document: ViewDocument;

  public readonly hasMultiLevelListPlugin: boolean;

  public readonly hasTablePropertiesPlugin: boolean;

  public readonly hasExtendedTableBlockAlignment: boolean;

  /**
   * Creates a new `PasteFromOfficeMSWordNormalizer` instance.
   *
   * @param document View document.
   */
  constructor(
    document: ViewDocument,
    hasMultiLevelListPlugin: boolean = false,
    hasTablePropertiesPlugin: boolean = false,
    hasExtendedTableBlockAlignment: boolean = false
  ) {
    this.document = document;
    this.hasMultiLevelListPlugin = hasMultiLevelListPlugin;
    this.hasTablePropertiesPlugin = hasTablePropertiesPlugin;
    this.hasExtendedTableBlockAlignment = hasExtendedTableBlockAlignment;
  }

  /**
   * @inheritDoc
   */
  public isActive(htmlString: string): boolean {
    return msWordMatch1.test(htmlString) || msWordMatch2.test(htmlString);
  }

  /**
   * @inheritDoc
   */
  public execute(data: PasteFromOfficeNormalizerData): void {
    const writer = new ViewUpcastWriter(this.document);
    const { body: documentFragment, stylesString } = data._parsedData;

    transformBookmarks(documentFragment, writer);
    // transformListItemLikeElementsIntoLists(documentFragment, stylesString, this.hasMultiLevelListPlugin);
    replaceImagesSourceWithBase64(documentFragment, data.dataTransfer.getData('text/rtf'));
    transformTables(documentFragment, writer, this.hasTablePropertiesPlugin, this.hasExtendedTableBlockAlignment);
    removeInvalidTableWidth(documentFragment, writer);
    replaceMSFootnotes(documentFragment, writer);
    removeMSAttributes(documentFragment);

    data.content = documentFragment;
  }
}
