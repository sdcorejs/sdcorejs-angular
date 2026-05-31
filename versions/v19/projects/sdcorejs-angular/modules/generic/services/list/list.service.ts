import { Injectable } from '@angular/core';
// import hash from 'object-hash';
import { GenericListOption, TList } from './list.model';
import { SdGenericService } from '../generic.service';
import { SdSchema } from '../../models';
import { SdTableColumn, SdTableExternalFilter, SdTableOption } from '@sdcorejs/angular/components/table';
import { ArrayUtilities, DateUtilities, NumberUtilities } from '@sdcorejs/angular/utilities';
import { Filter, Operator, Order } from '@sdcorejs/utils/models';
import { Utilities } from '@sdcorejs/utils/fns';

@Injectable({
  providedIn: 'root',
})
export class SdGenericListService {
  constructor(private genericService: SdGenericService) {}

  loadTableOption = async <T>(option: GenericListOption<T>): Promise<SdTableOption<TList<T>>> => {
    // Lấy menuId tùy theo kiểu dữ liệu truyền vào
    const { module, typeCode } = option;
    const register = this.genericService.getRegister(module, typeCode, option?.args);
    const schema = await register.schema();
    const columns = await this.#loadColumns(option);
    // Lấy thông tin externalFilters từ schema
    const key = Utilities.hash({
      generic: 'configuration',
      module,
      typeCode,
      registerArgs: option?.args,
    });
    return {
      type: 'server',
      key,
      reload: {
        visible: true,
      },
      items: async filterRequest => {
        const { rawColumnFilter, rawExternalFilter, orderBy, orderDirection } = filterRequest;
        // Column filters
        const filters = columns.map(column =>
          this.#loadFilter({
            columnOrExternalFilter: column,
            value: rawColumnFilter?.[column.field as never],
            operator: filterRequest?.columnOperator?.[column.field] || column.filter?.operator?.default,
          })
        );
        // External filters
        const externalFilters =
          option?.filter?.externalFilters?.map(externalFilter =>
            this.#loadFilter({
              columnOrExternalFilter: externalFilter,
              value: rawExternalFilter?.[externalFilter.field as never],
              operator: filterRequest?.columnOperator?.[externalFilter.field] || externalFilter.defaultOperator,
            })
          ) || [];
        const orders = this.#loadOrders(orderBy, orderDirection, option.orders);
        const fields = this.#loadFields(schema.primaryKey, columns, option.fields);
        const { items, total } = await register.paging({
          filters: [...(option?.filters || []), ...filters, ...externalFilters].filter(e => !!e),
          pageSize: filterRequest.pageSize,
          pageNumber: filterRequest.pageNumber,
          orders,
          fields,
        });
        await this.#loadLazyValues(schema, columns, items);
        return {
          items,
          total,
        };
      },

      columns,
      commands: option?.commands,
      filter: option?.filter,
      paginate: option?.paginate,
      export: option?.export,
      config: option?.config,
      selector: option?.selector,
      sort: option?.sort,
    };
  };

  #loadColumns = async <T>(configuration: GenericListOption<T>): Promise<SdTableColumn<TList<T>>[]> => {
    if (!configuration?.module || !configuration?.typeCode) {
      return [];
    }
    const { module, typeCode, args, override } = configuration;
    const register = this.genericService.getRegister(module, typeCode, args);
    const schema = await register.schema();
    const columns: SdTableColumn<TList<T>>[] = [];
    if (configuration.columns?.length) {
      for (const configurationColumn of configuration.columns) {
        if (typeof configurationColumn === 'string') {
          const column = await this.#loadColumn(schema, override, configurationColumn);
          if (column) {
            columns.push(column);
          }
        } else {
          columns.push(configurationColumn);
        }
      }
    } else {
      for (const field of schema.properties.map(e => e.code)) {
        const column = await this.#loadColumn(schema, override, field);
        if (column) {
          columns.push(column);
        }
      }
    }
    return columns;
  };

  #loadColumn = async <T>(
    schema: SdSchema<T>,
    overide: GenericListOption<T>['override'],
    field: string
  ): Promise<SdTableColumn<TList<T>> | undefined> => {
    const property = schema.properties.find(e => e.code === field);
    if (!property) {
      return undefined;
    }
    const { code, label, type } = property;
    const list = Object.assign({ ...property?.list }, { ...overide?.[code] });
    if (type === 'number') {
      return {
        type: 'number',
        field: code,
        title: label,
        ...list,
      };
    }
    if (type === 'date') {
      return {
        type: 'date',
        field: code,
        title: label,
        ...list,
      };
    }
    if (type === 'datetime') {
      return {
        type: 'datetime',
        field: code,
        title: label,
        ...list,
      };
    }
    if (type === 'boolean') {
      return {
        type: 'boolean',
        field: code,
        title: label,
        ...list,
      };
    }
    if (type === 'enum') {
      return {
        type: 'values',
        field: code,
        title: label,
        option: {
          items: property.options || [],
          valueField: 'value',
          displayField: 'display',
          selection: 'MULTIPLE',
        },
        ...list,
      };
    }
    if (type === 'relation') {
      const register = this.genericService.getRegister(schema.module, property.typeCode);
      const relationSchema = await register.schema();
      const valueField = property.valueField ?? relationSchema.primaryKey;
      const displayField = property.displayField ?? relationSchema.primaryKey;
      return {
        type: 'lazy-values',
        field: code,
        title: label,
        option: {
          items: async req => {
            return await register.search({
              ...req,
              searchFields: [
                property.valueField ?? relationSchema.primaryKey,
                property.displayField ?? relationSchema.primaryKey,
                ...(property.searchFields || []),
              ],
            });
          },
          valueField,
          displayField,
          selection: 'MULTIPLE',
        },
        transform: (value, rowData) => {
          return rowData.sdList?.lazyValues?.[code]?.map(item => item?.[displayField])?.join(', ') || '';
        },
        ...list,
      };
    }
    return {
      type: 'string',
      field: code,
      title: label,
      ...list,
    };
  };

  #loadLazyValues = async <T>(schema: SdSchema<T>, columns: SdTableColumn<T>[], items: TList<T>[]) => {
    const relationColumns = schema.properties.filter(e => e.type === 'relation');
    for (const column of columns.filter(e => e.type === 'lazy-values')) {
      const relationColumn = relationColumns.find(e => e.code === column.field);
      if (relationColumn?.module && relationColumn?.typeCode) {
        const { valueField } = column.option;
        // Gộp identityValues (ids) lại để gọi request 1 lần duy nhất
        const identityValues: string[] = items
          .filter(e => !!e?.[column.field]?.toString())
          .map(e => e[column.field])
          .reduce<string[]>((current, next) => [...current, ...(Array.isArray(next) ? next : [next])], []);
        if (identityValues.length) {
          const register = this.genericService.getRegister(relationColumn.module, relationColumn.typeCode);
          const lazyValues = await register
            .all({
              filters: [
                {
                  field: column.option.valueField,
                  data: ArrayUtilities.distinct(identityValues),
                  operator: 'IN',
                },
              ],
            })
            .catch(err => {
              console.error(err);
              return [];
            });
          items
            .filter(e => !!e?.[column.field]?.toString())
            .forEach(item => {
              item.sdList = item.sdList || {};
              item.sdList.lazyValues = item.sdList.lazyValues || {};
              const identityValues = item?.[column.field];
              if (Array.isArray(identityValues)) {
                item.sdList.lazyValues[column.field] = identityValues
                  .map(val => lazyValues?.find(item => item?.[valueField] === val))
                  .filter(val => !!val);
              } else if (identityValues) {
                item.sdList.lazyValues[column.field] = [identityValues]
                  .map(val => lazyValues?.find(item => item?.[valueField] === val))
                  .filter(val => !!val);
              }
            });
        }
      }
    }
  };

  #loadFilter = (args: {
    columnOrExternalFilter: SdTableColumn | SdTableExternalFilter;
    value: any;
    operator?: Operator;
  }): Filter | undefined => {
    const { columnOrExternalFilter: column, operator, value } = args;
    const { field, type } = column;
    if (operator === 'NULL' || operator === 'NOT_NULL') {
      return {
        field: column.field,
        operator,
      };
    }
    if (!value?.toString()) {
      return undefined;
    }
    if (Array.isArray(value)) {
      if (!value.length) {
        return undefined;
      }
      // Mảng thì chỉ filter theo IN/NOT_IN
      if (operator === 'IN' || operator === 'NOT_IN') {
        return {
          field,
          data: value,
          operator,
        };
      }
      return {
        field,
        data: value,
        operator: 'IN',
      };
    }
    if (type === 'number') {
      if (!NumberUtilities.isNumber(value)) {
        return undefined;
      }
      if (
        operator === 'NOT_EQUAL' ||
        operator === 'EQUAL' ||
        operator === 'GREATER_OR_EQUAL' ||
        operator === 'GREATER_THAN' ||
        operator === 'LESS_OR_EQUAL' ||
        operator === 'LESS_THAN'
      ) {
        return {
          field,
          data: +value,
          operator,
        };
      }
      return {
        field,
        data: +value,
        operator: 'EQUAL',
      };
    }
    if (type === 'boolean') {
      if (value !== true && value !== false) {
        return undefined;
      }
      // Boolean thì luôn filter theo EQUAL
      return {
        field,
        data: value,
        operator: 'EQUAL',
      };
    }
    if (type === 'datetime' || type === 'date') {
      if (value && DateUtilities.isDate(value)) {
        if (operator === 'START_WITH') {
          return {
            field,
            data: DateUtilities.toFormat(DateUtilities.begin(value), 'yyyy/MM/dd HH:mm:ss'),
            operator: 'START_WITH',
          };
        } else if (operator === 'END_WITH') {
          return {
            field,
            data: DateUtilities.toFormat(DateUtilities.end(value), 'yyyy/MM/dd HH:mm:ss'),
            operator: 'END_WITH',
          };
        } else {
          return {
            field,
            data: {
              from: DateUtilities.toFormat(DateUtilities.begin(value), 'yyyy/MM/dd HH:mm:ss'),
              to: DateUtilities.toFormat(DateUtilities.end(value), 'yyyy/MM/dd HH:mm:ss'),
            },
            operator: 'BETWEEN',
          };
        }
      } else if (DateUtilities.isDate(value?.from) && DateUtilities.isDate(value?.to)) {
        return {
          field,
          data: {
            from: DateUtilities.toFormat(value?.from, 'yyyy/MM/dd HH:mm:ss'),
            to: DateUtilities.toFormat(value?.to, 'yyyy/MM/dd HH:mm:ss'),
          },
          operator: 'BETWEEN',
        };
      } else {
        return undefined;
      }
    }
    if (type === 'daterange') {
      if (DateUtilities.isDate(value?.from) && DateUtilities.isDate(value?.to)) {
        return {
          field,
          data: {
            from: DateUtilities.toFormat(value?.from, 'yyyy/MM/dd HH:mm:ss'),
            to: DateUtilities.toFormat(value?.to, 'yyyy/MM/dd HH:mm:ss'),
          },
          operator: 'BETWEEN',
        };
      } else if (value && DateUtilities.isDate(value)) {
        return undefined;
      }
    }
    if (type === 'values' || type === 'lazy-values') {
      if (operator === 'NOT_EQUAL' || operator === 'EQUAL') {
        return {
          field,
          data: value,
          operator,
        };
      }
      return {
        field,
        data: value,
        operator: 'EQUAL',
      };
    }
    // STRING
    if (operator === 'EQUAL' || operator === 'NOT_EQUAL' || operator === 'CONTAIN' || operator === 'NOT_CONTAIN') {
      return {
        field,
        data: value,
        operator,
      };
    } else if (operator === 'IN' || operator === 'NOT_IN') {
      if (typeof value === 'string') {
        return {
          field,
          data: value?.split(',')?.map(val => val?.toString()?.trim()) || [],
          operator,
        };
      } else {
        return undefined;
      }
    }
    // Mặc định là CONTAIN
    return {
      field,
      data: value,
      operator: 'CONTAIN',
    };
  };

  #loadOrders = <T>(orderBy: string, orderDirection: 'asc' | 'desc' | '', orders?: Order[]): Order<T>[] => {
    if (orders?.length) {
      return orders;
    }
    if (orderBy && orderDirection) {
      return [
        {
          field: orderBy as never,
          direction: orderDirection === 'desc' ? 'DESC' : 'ASC',
        },
      ];
    }
    return [];
  };

  #loadFields = <T>(primaryKey: string, columns: SdTableColumn<T>[], fields?: string[]) => {
    return ArrayUtilities.distinct([primaryKey, ...columns.map(e => e.field), ...(fields || [])]);
  };
}
