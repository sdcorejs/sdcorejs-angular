/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module paste-from-office/normalizers/googlesheetsnormalizer
 */

import { ViewUpcastWriter, type ViewDocument } from 'ckeditor5';

import { removeXmlns } from '../filters/removexmlns';
import { removeGoogleSheetsTag } from '../filters/removegooglesheetstag';
import { removeInvalidTableWidth } from '../filters/removeinvalidtablewidth';
import { removeStyleBlock } from '../filters/removestyleblock';
import type { PasteFromOfficeNormalizer, PasteFromOfficeNormalizerData } from '../types';

const googleSheetsMatch = /<google-sheets-html-origin/i;

/**
 * Normalizer for the content pasted from Google Sheets.
 *
 * @internal
 */
export class GoogleSheetsNormalizer implements PasteFromOfficeNormalizer {
	public readonly document: ViewDocument;

	/**
	 * Creates a new `GoogleSheetsNormalizer` instance.
	 *
	 * @param document View document.
	 */
	constructor( document: ViewDocument ) {
		this.document = document;
	}

	/**
	 * @inheritDoc
	 */
	public isActive( htmlString: string ): boolean {
		return googleSheetsMatch.test( htmlString );
	}

	/**
	 * @inheritDoc
	 */
	public execute( data: PasteFromOfficeNormalizerData ): void {
		const writer = new ViewUpcastWriter( this.document );
		const { body: documentFragment } = data._parsedData;

		removeGoogleSheetsTag( documentFragment, writer );
		removeXmlns( documentFragment, writer );
		removeInvalidTableWidth( documentFragment, writer );
		removeStyleBlock( documentFragment, writer );

		data.content = documentFragment;
	}
}
