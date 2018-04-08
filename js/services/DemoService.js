(function (angular) {
    function DemoService($resource, $q, $http) {
        this._getTaskNameListUrl = "/dempTaskDatas/list";
        this._getDataSheetListUrl = "/dempDbConnection/:id/findTables";
        this._getTableFieldUrl = "/dempDbConnection/:id/findColumns/:tableName";
        this._getDataSourceNameListUrl = "/dempDataSources/list/:nodeId";


        //接收-获取业务名称
        this.getTaskNameList = function () {
            return $resource(this._getTaskNameListUrl).get();
        };

        //获取数据源名称 (数据库列表)
        this.getDataSourceNameList = function (nodeId) {
            return $resource(this._getDataSourceNameListUrl).get({nodeId:nodeId});
        };

        //根据数据库获取数据表
        this.getDataSheetList = function (id) {
            return $resource(this._getDataSheetListUrl).get({id: id});
        };

        //根据数据库、数据表、获取表内字段
        this.getTableField = function (id, tableName) {
            return $resource(this._getTableFieldUrl).get({id: id, tableName: tableName});
        };
    }

    DemoService.$inject = ['$resource', '$q', '$http'];
    angular.module('SqlTollApp').service('DemoService', DemoService);
})(angular);