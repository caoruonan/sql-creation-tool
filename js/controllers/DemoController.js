SqlTollApp.controller('DemoController', ['$scope', '$uibModal', 'DemoService',function($scope, $uibModal, DemoService){
    $scope.modelNodeId = 1;
    $scope.model = {};
    $scope.dataSheetModuleList = [];

    $scope.itemRepeatFinish = function () {
        $scope.jsPlumbInit();
        angular.forEach($scope.dataSheetModuleList, function (data) {
            var dom = angular.element('#' + data.defineId);
            dom.css('top', data.location.top).css('left', data.location.left);
            $scope.instance.addGroup({
                el: document.getElementById(data.defineId),
                id: data.defineId,
                anchor: [ "Right", "Left"],
                endpoint: ["Dot", {radius: 4, cssClass:"small-blue"}],
                dragOptions: {
                    handle: "span.title, span.title div",
                    grid: [15, 15],
                    containment: "#Content-Main"
                }
            });
            var fieldsDom = dom.children('div.field-box');
            $scope.instance.addToGroup(data.defineId, fieldsDom);
            $scope.instance.setContainer('Content-Main');
            $scope._makeSource(fieldsDom);
            $scope._makeTarget(fieldsDom);
        });
        angular.forEach(sqlModel.router, function (data) {
            $scope.instance.connect({
                source: data.sourceId,
                target: data.targetId
            });
        });
    };

    $scope.dataSourceNameList = [];
    $scope.getDataSourceNameList = function () {
        DemoService.getDataSourceNameList().$promise.then(function (result) {
            if (result.status === 'success') {
                $scope.dataSourceNameList = result.data;
                $scope.model.database = angular.copy(result.data[0].id).toString();
                $scope.model.databaseName = angular.copy(result.data[0].dbName);
                $scope.getDataSheetList();
            } else {
                for (var i = 0; i < result.errors.length; i++) {
                    toastr.error("数据获取失败", result.errors[i].errmsg);
                }
            }
        });
    };
    $scope.getDataSourceNameList();

    $scope.databaseChange = function () {
        $scope.finalStringList = {
            Distinct: false,
            SELECT: [],
            FROM: [],
            WHERE: [],
            GROUP_BY: [],
            HAVING: [],
            ORDER_BY: [],
            LIMIT:['', '']
        };
        $scope.popoverModel = {};
        angular.forEach($scope.dataSheetModuleList, function (data, index) {
            $scope.instance.removeGroup(data.defineId, true);
        });
        $scope.dataSheetModuleList = [];
        $scope.taskSql = '';
        angular.forEach($scope.dataSourceNameList,function (data, index) {
            if ($scope.model.database == data.id) {
                $scope.model.databaseName = data.dbName;
            }
        });
        $scope.getDataSheetList()
    };

    $scope.dataSheetList = [];
    $scope.getDataSheetList = function () {
        DemoService.getDataSheetList($scope.model.database).$promise.then(function (result) {
            if (result.status === 'success') {
                $scope.dataSheetList = result.data;
            } else {
                for (var i = 0; i < result.errors.length; i++) {
                    toastr.error("数据获取失败", result.errors[i].errmsg);
                }
            }
        })
    };


    $scope.$on('ngRepeatFinished', function () {
        angular.element(".draggable").draggable({
            helper: "clone",
            zIndex: 10050,
            revert: "invalid",
            start: function (e) {
                $scope.popover_cancel();
                $scope._initDroppable(e.currentTarget.id, e.currentTarget.innerText);
            }
        });
    });
    $scope._makeSource = function ($el) {
        $scope.instance.makeSource($el, {
            filter:"input",
            filterExclude:true,
            anchor: [ "Right", "Left"],
            connectorStyle: {strokeStyle: "#dedede", lineWidth: 2},
            maxConnections: 20,
            onMaxConnections: function () {
                toastr.error('', "最大连接数！");
                return false;
            }
        })
    };
    $scope._makeTarget = function ($el) {
        $scope.instance.makeTarget($el, {
            anchor: [ "Right", "Left"],
            maxConnections: 20,
            onMaxConnections: function () {
                toastr.error('', "最大连接数！");
                return false;
            }
        })
    };

    //坐标判断函数,动态设置DOM坐标
    $scope.coordinateJudgment = function (dom) {
        var top = parseInt($scope.addData.location.top) - $('#' + $scope.addData.defineId).parent().offset().top;
        var left = parseInt($scope.addData.location.left) - $('#' + $scope.addData.defineId).parent().offset().left;
        var parentTop = $('#' + $scope.addData.defineId).parent().outerHeight() - dom.outerHeight();
        var parentleft = $('#' + $scope.addData.defineId).parent().outerWidth() - dom.outerWidth();
        if (top < 0) {
            top = 0;
        }
        if (left < 0) {
            left = 0;
        }
        if (top > parentTop) {
            top = parentTop;
        }
        if (left > parentleft) {
            left = parentleft;
        }
        dom.css('top', top).css('left', left);
    };
    //判断连线的函数
    $scope.judge = function (params) {
        if (params.targetId === params.sourceId) {
            return true;
        }else if (params.source.parentNode.id === params.target.parentNode.id) {
            return true;
        }
    };

    $scope.jsPlumbInit = function () {
        jsPlumb.ready(function () {
            $scope.instance = jsPlumb.getInstance({
                Connector: "Flowchart",
                DragOptions: {cursor: 'pointer'},
                Endpoint: ["Dot", {radius: 4, cssClass:"small-blue"}],
                connectorStyle:{ lineWidth:1},
                HoverPaintStyle:{ strokeStyle: "#5bc0de"},
                Overlays: [
                    ["Label", {label: ""}]
                ],
                Container: 'Content-Main'
            });
            //连线成功的事件回调
            $scope.connectionFlag = true;
            $scope.instance.bind("connection", function (params) {
                if ($scope.connectionFlag) {
                    var conn = params.connection;
                    if ($scope.judge(params)) {
                        $scope.instance.detach(conn, {fireEvent: false});//解绑
                        return false
                    }
                    var flag = parseInt(params.source.parentNode.id) > parseInt(params.target.parentNode.id) ? parseInt(params.source.parentNode.id) : parseInt(params.target.parentNode.id);
                    $scope.$apply(function () {
                        $scope.sourceStr = '';
                        $scope.targetStr = '';
                        angular.forEach($scope.finalStringList.FROM, function (data) {
                            if (params.source.parentNode.id === data.defineId) {
                                $scope.sourceStr = data.alias?data.alias:data.from
                            }
                            if (params.target.parentNode.id === data.defineId) {
                                $scope.targetStr = data.alias?data.alias:data.from
                            }
                            if (flag.toString() === data.defineId) {
                                if (data.content.length) {
                                    data.content.push({
                                        contact: 'AND',
                                        from: $scope.sourceStr + '.' + (params.source.innerText).replace("\n",""),
                                        fromId: params.source.id,
                                        fromDefineId: params.source.parentNode.id,
                                        mark: conn,
                                        relation: '=',
                                        to: $scope.targetStr + '.' + (params.target.innerText).replace("\n",""),
                                        toId: params.target.id,
                                        toDefineId: params.target.parentNode.id
                                    })
                                }else {
                                    data.content.push({
                                        from: $scope.sourceStr + '.' + (params.source.innerText).replace("\n",""),
                                        fromId: params.source.id,
                                        fromDefineId: params.source.parentNode.id,
                                        mark: conn,
                                        relation: '=',
                                        to: $scope.targetStr + '.' + (params.target.innerText).replace("\n",""),
                                        toId: params.target.id,
                                        toDefineId: params.target.parentNode.id
                                    })
                                }

                            }
                        })
                    })
                }
                $scope.connectionFlag = true;
            });
            //取消连线事件
            $scope.instance.bind("connectionDetached", function (params) {
                var conn = params.connection;
                angular.forEach($scope.finalStringList.FROM, function (data, dataIndex) {
                    angular.forEach(data.content, function (content, index) {
                        if (conn.id === content.mark.id) {
                            data.content.splice(index, 1);
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    })
                })
            });
            //点停止拖动事件
            $scope.instance.bind("connectionMoved", function (params) {
                $scope.connectionFlag = false;
                var conn = params.connection;
                $scope.sourceStr = '';
                $scope.targetStr = '';
                var flag = parseInt(conn.source.parentNode.id) > parseInt(conn.target.parentNode.id) ? parseInt(conn.source.parentNode.id) : parseInt(conn.target.parentNode.id);
                angular.forEach($scope.finalStringList.FROM, function (data) {
                    if (conn.source.parentNode.id === data.defineId) {
                        $scope.sourceStr = data.alias?data.alias:data.from
                    }
                    if (conn.target.parentNode.id === data.defineId) {
                        $scope.targetStr = data.alias?data.alias:data.from
                    }
                });
                var currentId = '';
                var currentDataIndex = -1;
                var currentIndex = -1;
                $scope.$apply(function () {
                    angular.forEach($scope.finalStringList.FROM, function (data, dataIndex) {
                        angular.forEach(data.content, function (content, index) {
                            if (conn.id === content.mark.id) {
                                currentId = data.defineId;
                                currentDataIndex = dataIndex;
                                currentIndex = index;
                                content.from = $scope.sourceStr + '.' + (conn.source.innerText).replace("\n","");
                                content.fromId = conn.source.id;
                                content.fromDefineId = conn.source.parentNode.id;
                                content.to = $scope.targetStr + '.' + (conn.target.innerText).replace("\n","");
                                content.toId = conn.target.id;
                                content.toDefineId = conn.target.parentNode.id;
                            }
                        });
                    });
                    angular.forEach($scope.finalStringList.FROM, function (data, dataIndex) {
                        if (flag.toString() === data.defineId && currentId && currentId !== flag.toString() && dataIndex !== 0) {
                            var item = $scope.finalStringList.FROM[currentDataIndex].content[currentIndex];
                            if (data.content.length) {
                                item.contact =  'AND'
                            }else {
                                delete item.contact
                            }
                            data.content.push(item);
                            $scope.finalStringList.FROM[currentDataIndex].content.splice(currentIndex, 1);
                            if ($scope.finalStringList.FROM[currentDataIndex].content[0] && $scope.finalStringList.FROM[currentDataIndex].content[0].contact) {
                                delete $scope.finalStringList.FROM[currentDataIndex].content[0].contact
                            }
                        }
                    })
                });
            });
            //组内添加元素事件
            $scope.instance.bind("group:addMember", function(p) {
                // _appendEvent("group:add", p.group.id);
            });
        });
    };
    $scope.jsPlumbInit();

    $scope.addDomInit = function (id, name, ui) {
        $scope.addData = {
            "id": id,
            "name": name,
            "defineId": new Date().getTime().toString(),
            "location": {
                "top": ui.offset.top,
                "left": ui.offset.left
            }
        };
        DemoService.getTableField($scope.model.database, name).$promise.then(function (result) {
            if (result.status === "success") {
                $scope.addData.fields = result.data;
                angular.forEach($scope.addData.fields,function (data, index) {
                    data.defineId = new Date().getTime().toString() + index
                });
                $scope.dataSheetModuleList.push($scope.addData);
            } else {
                for (var i = 0; i < result.errors.length; i++) {
                    toastr.error("数据获取失败", result.errors[i].errmsg);
                }
            }
        });
        $scope.itemRepeatFinish = function () {
            $scope.dom = angular.element('#' + $scope.addData.defineId);
            $scope.coordinateJudgment($scope.dom);
            $scope.instance.addGroup({
                el: document.getElementById($scope.addData.defineId),
                id: $scope.addData.defineId,
                anchor: [ "Right", "Left"],
                endpoint: ["Dot", {radius: 4, cssClass:"small-blue"}],
                dragOptions: {
                    handle: "span.title, span.title div",
                    grid: [15, 15],
                    containment: "#Content-Main"
                }
            });
            $scope.fieldsDom = $scope.dom.children('div.field-box');
            $scope.instance.addToGroup($scope.addData.defineId, $scope.fieldsDom);
            $scope.instance.setContainer('Content-Main');
            $scope._makeSource($scope.fieldsDom);
            $scope._makeTarget($scope.fieldsDom);
        }
    };
    //拖拽添加DOM
    $scope._initDroppable = function (id, name) {
        $("#Content-Main").droppable({
            drop: function (event, ui) {
                $scope.$apply(function () {
                    $scope.addDomInit(id, name, ui);
                });
                if ($scope.finalStringList.FROM.length){
                    $scope.finalStringList.FROM.push({
                        defineId: $scope.addData.defineId,
                        relation: ',',
                        from: $scope.addData.name,
                        alias: '',
                        content: []
                    })
                }else {
                    $scope.finalStringList.FROM.push({
                        defineId: $scope.addData.defineId,
                        from: $scope.addData.name,
                        alias: ''
                    })
                }
            }
        })
    };

    //单个字段选中
    $scope.fieldSelect = function (module, field) {
        if (field.select) {
            var flag = false;
            angular.forEach(module.fields, function (data) {
                if (!data.select) {
                    flag = true
                }
            });
            module.select = !flag;
            $scope.finalStringList.SELECT.push({
                defineId: module.defineId,
                id: field.defineId,
                text: (module.alias?module.alias:module.name) + '.' + field.name,
                alias: '',
                constraint: '<func>'
            });
        }else {
            module.select = false;
            field.alias = '';
            angular.forEach($scope.finalStringList.ORDER_BY, function (data) {
                if (data.defineId === module.defineId && field.defineId === data.id) {
                    data.alias = ''
                }
            });
            for (var index = $scope.finalStringList.SELECT.length - 1; index >= 0; index --) {
                if ($scope.finalStringList.SELECT[index].defineId === module.defineId && field.defineId === $scope.finalStringList.SELECT[index].id) {
                    $scope.finalStringList.SELECT.splice(index, 1)
                }
            }
            for (var index = $scope.finalStringList.HAVING.length - 1; index >= 0; index --) {
                if (field.defineId === $scope.finalStringList.HAVING[index].fromId || field.defineId === $scope.finalStringList.HAVING[index].toId) {
                    if (index === 0 && $scope.finalStringList.HAVING.length > 1) {
                        delete $scope.finalStringList.HAVING[1].contact
                    }
                    $scope.finalStringList.HAVING.splice(index, 1)
                }
            }
        }
    };
    //字段全选
    $scope.moduleSelect = function (module) {
        for (var index = $scope.finalStringList.SELECT.length - 1; index >= 0; index --) {
            if (!module.select && $scope.finalStringList.SELECT[index].defineId === module.defineId) {
                $scope.finalStringList.SELECT.splice(index, 1)
            }
        }
        if (module.fields.length) {
            var arr = angular.copy($scope.finalStringList.SELECT);
            angular.forEach(module.fields, function (data) {
                if (module.select) {
                    data.select = true;
                    var flag = false;
                    angular.forEach($scope.finalStringList.SELECT, function (item) {
                        if (item.defineId === module.defineId && item.id === data.defineId) {
                            flag = true
                        }
                    });
                    if (!flag) {
                        $scope.finalStringList.SELECT.push({
                            defineId: module.defineId,
                            id: data.defineId,
                            text: (module.alias?module.alias:module.name) + '.' + data.name,
                            alias: '',
                            constraint: '<func>'
                        });
                    }
                }else {
                    data.select = false;
                    data.alias = '';
                }
            })
        }
        if (!module.select) {
            angular.forEach($scope.finalStringList.ORDER_BY, function (data) {
                if (data.defineId === module.defineId) {
                    data.alias = ''
                }
            });
            for (var index = $scope.finalStringList.HAVING.length - 1; index >= 0; index --) {
                if (module.defineId === $scope.finalStringList.HAVING[index].fromId || module.defineId === $scope.finalStringList.HAVING[index].toId) {
                    if (index === 0 && $scope.finalStringList.HAVING.length > 1) {
                        delete $scope.finalStringList.HAVING[1].contact
                    }
                    $scope.finalStringList.HAVING.splice(index, 1)
                }
            }
        }
    };
    //删除表模块
    $scope.removeModule = function (defineId) {
        angular.forEach($scope.dataSheetModuleList, function (data, index) {
            if (data.defineId === defineId) {
                $scope.dataSheetModuleList.splice(index, 1);
                $scope.instance.removeGroup(defineId, true);
            }
        });
        angular.forEach($scope.finalStringList.FROM, function (data, index) {
            if (data.defineId === defineId) {
                angular.forEach($scope.finalStringList.FROM[index].content, function (data) {
                    if (data.mark) {
                        $scope.instance.detach(data.mark, {fireEvent: false});
                    }
                });
                if (index === 0 && $scope.finalStringList.FROM.length > 1) {
                    delete $scope.finalStringList.FROM[1].relation;
                    delete $scope.finalStringList.FROM[1].content
                }
                $scope.finalStringList.FROM.splice(index, 1);
            }
        });
        for (var index = $scope.finalStringList.SELECT.length - 1; index >= 0; index --) {
            if (defineId === $scope.finalStringList.SELECT[index].defineId) {
                $scope.finalStringList.SELECT.splice(index, 1)
            }
        }
        for (var index = $scope.finalStringList.WHERE.length - 1; index >= 0; index --) {
            if (defineId === $scope.finalStringList.WHERE[index].fromId || defineId === $scope.finalStringList.WHERE[index].toId) {
                if (index === 0 && $scope.finalStringList.WHERE.length > 1) {
                    delete $scope.finalStringList.WHERE[1].contact
                }
                $scope.finalStringList.WHERE.splice(index, 1);
            }
        }
        for (var index = $scope.finalStringList.GROUP_BY.length - 1; index >= 0; index --) {
            if (defineId === $scope.finalStringList.GROUP_BY[index].defineId) {
                $scope.finalStringList.GROUP_BY.splice(index, 1)
            }
        }
        for (var index = $scope.finalStringList.HAVING.length - 1; index >= 0; index --) {
            if (defineId === $scope.finalStringList.HAVING[index].fromDefineId || defineId === $scope.finalStringList.HAVING[index].toDefineId) {
                if (index === 0 && $scope.finalStringList.HAVING.length > 1) {
                    delete $scope.finalStringList.HAVING[1].contact
                }
                $scope.finalStringList.HAVING.splice(index, 1)
            }
        }
        for (var index = $scope.finalStringList.ORDER_BY.length - 1; index >= 0; index --) {
            if (defineId === $scope.finalStringList.ORDER_BY[index].defineId) {
                $scope.finalStringList.ORDER_BY.splice(index, 1)
            }
        }
    };
    //模块开关
    $scope.switch = function (id) {
        var flag = angular.element( '#' + id).hasClass('collapsed');
        $scope.instance[flag ? "removeClass" : "addClass"](angular.element( '#' + id), 'collapsed');
        $scope.instance[flag ? "expandGroup" : "collapseGroup"](id);
    };

    $scope.relationshipList = ['=','<>','<','<=','>','>=','like','not like','is null','is not null','is between','is not between','is in list','is not in list','[Custom Expression]'];
    $scope.contactList = ['AND','OR','AND NOT','OR NOT'];
    $scope.fromRelationList = [',','INNER JOIN','LEFT JOIN','RIGHT JOIN','LEFT OUTER JOIN','RIGHT OUTER JOIN','CROSS JOIN','STRAIGHT JOIN','NATURAL JOIN','NATURAL LEFT JOIN','NATURAL RIGHT JOIN','[Custom Join]'];
    $scope.constraintList = ['Sum','Max','Min','Avg','Count','<func>'];
    $scope.popoverModel = {};
    $scope.finalStringList = {
        Distinct: false,
        SELECT: [],
        FROM: [],
        WHERE: [],
        GROUP_BY: [],
        HAVING: [],
        ORDER_BY: [],
        LIMIT:['', '']
    };
    $scope.pushItem = function (flag, index, item) {
        if (item && index){
            if(!$scope.finalStringList[flag][index][item].length) {
                $scope.finalStringList[flag][index][item].push({from: '',fromId: '', relation: '=', to: '', toId: ''});
            }else {
                $scope.finalStringList[flag][index][item].push({from: '',fromId: '', relation: '=', to: '', toId: '', contact: 'AND'});
            }
        }else {
            if(!$scope.finalStringList[flag].length) {
                $scope.finalStringList[flag].push({from: '',fromId: '', relation: '=', to: '', toId: ''});
            }else {
                $scope.finalStringList[flag].push({from: '',fromId: '', relation: '=', to: '', toId: '', contact: 'AND'});
            }
        }
    };
    $scope.getPopoverFlag = function (flag, index, select, item, childItem) {
        $scope.popoverFlag = flag;
        $scope.popoverFlagIndex = index;
        $scope.popoverFlagSelect = select;
        $scope.popoverFlagItem = item;
        $scope.popoverFlagChildIndex = childItem;
        if ('ORDER_BY' === $scope.popoverFlag || 'GROUP_BY' === $scope.popoverFlag || 'WHERE' === $scope.popoverFlag || 'FROM' === $scope.popoverFlag || 'SELECT' === $scope.popoverFlag) {
            $scope.popoverModel.chooseFieldList = [];
            $scope.popoverFlagSelectIndex = -1;
            angular.forEach($scope.dataSheetModuleList, function (data, index) {
                angular.forEach(data.fields, function (field) {
                    var str = (data.alias?data.alias:data.name) + '.' + field.name;
                    if ('ORDER_BY' === $scope.popoverFlag) {
                        $scope.popoverModel.chooseFieldList.push({alias: field.alias, name: str, id: field.defineId, defineId: data.defineId});
                        if ($scope.popoverFlagSelect && (field.alias === $scope.popoverFlagSelect || str === $scope.popoverFlagSelect) && $scope.popoverFlagSelectIndex < 0) {
                            $scope.popoverFlagSelectIndex = $scope.popoverModel.chooseFieldList.length - 1
                        }
                    }else {
                        $scope.popoverModel.chooseFieldList.push({name:str, id: field.defineId, defineId: data.defineId});
                        if ($scope.popoverFlagSelect && str === $scope.popoverFlagSelect && $scope.popoverFlagSelectIndex < 0) {
                            $scope.popoverFlagSelectIndex = $scope.popoverModel.chooseFieldList.length - 1
                        }
                    }
                });
            });
        }
        if ('HAVING' === $scope.popoverFlag) {
            $scope.popoverModel.nodeSelected = [];
            $scope.popoverFlagSelectIndex = -1;
            angular.forEach($scope.finalStringList.SELECT, function (data) {
                $scope.popoverModel.nodeSelected.push({alias: data.alias, name: data.text, mark: data.mark, id: data.id, defineId: data.defineId});
                if ($scope.popoverFlagSelect && (data.alias === $scope.popoverFlagSelect || data.text === $scope.popoverFlagSelect) && $scope.popoverFlagSelectIndex < 0) {
                    $scope.popoverFlagSelectIndex = $scope.popoverModel.nodeSelected.length - 1
                }
            })
        }
        if ('LIMIT' === $scope.popoverFlag) {
            $scope.popoverModel.enterText = $scope.finalStringList[flag][index]
        }
        if (('FROM' === $scope.popoverFlag || 'SELECT' === $scope.popoverFlag) && index >= 0) {
            $scope.popoverModel.enterText = $scope.finalStringList[flag][index][item]
        }
        if ('SELECT' === $scope.popoverFlag && item === 'text' && childItem) {
            angular.forEach($scope.dataSheetModuleList, function (data) {
                if (childItem === data.defineId) {
                    $scope.popoverModel.chooseFromFieldList = [];
                    angular.forEach(data.fields, function (field) {
                        $scope.popoverModel.chooseFromFieldList.push({name:field.name, id: field.defineId, defineId: data.defineId})
                    });
                    angular.forEach($scope.popoverModel.chooseFromFieldList, function (element, index) {
                        var arr = $scope.popoverFlagSelect.split('.');
                        if (arr[1] === element.name && $scope.popoverFlagSelectIndex < 0) {
                            $scope.popoverFlagSelectIndex = index
                        }
                    })
                }
            })
        }
    };

    $scope.inputText_ok = function () {
        $scope.popover_cancel();
        if ('LIMIT' === $scope.popoverFlag) {
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex] = $scope.popoverModel.enterText
        }
        if ('FROM' === $scope.popoverFlag) {
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem] = $scope.popoverModel.enterText;
            var defineId = $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].defineId;
            angular.forEach($scope.dataSheetModuleList, function (data) {
                if (defineId === data.defineId) {
                    data.alias = $scope.popoverModel.enterText;
                }
                if (!$scope.popoverModel.enterText) {
                    $scope.popoverModel.enterText = data.name
                }
            });
            angular.forEach($scope.finalStringList.SELECT, function (data) {
                if (defineId === data.defineId) {
                    var arr = data.text.split('.');
                    data.text = $scope.popoverModel.enterText + '.' + arr[1]
                }
            });
            angular.forEach($scope.finalStringList.WHERE, function (data) {
                if (defineId === data.fromId) {
                    var arr = data.from.split('.');
                    data.from = $scope.popoverModel.enterText + '.' + arr[1]
                }
                if (data.relation === 'is in list' || data.relation === 'is not in list') {
                    angular.forEach(data.list, function (list) {
                        if (defineId === list.defineId) {
                            var arr = list.text.split('.');
                            list.text = $scope.popoverModel.enterText + '.' + arr[1]
                        }
                    })
                }else {
                    if (defineId === data.toId) {
                        var arr = data.to.split('.');
                        data.to = $scope.popoverModel.enterText + '.' + arr[1]
                    }
                }
            });
            angular.forEach($scope.finalStringList.GROUP_BY, function (data) {
                if (defineId === data.defineId) {
                    var arr = data.text.split('.');
                    data.text = $scope.popoverModel.enterText + '.' + arr[1]
                }
            });
            angular.forEach($scope.finalStringList.HAVING, function (data) {
                if (defineId === data.fromDefineId) {
                    var arr = data.from.split('.');
                    data.from = $scope.popoverModel.enterText + '.' + arr[1]
                }
                if (data.relation === 'is in list' || data.relation === 'is not in list') {
                    angular.forEach(data.list, function (list) {
                        if (defineId === list.defineId) {
                            var arr = list.text.split('.');
                            list.text = $scope.popoverModel.enterText + '.' + arr[1]
                        }
                    })
                }else {
                    if (defineId === data.toDefineId) {
                        var arr = data.to.split('.');
                        data.to = $scope.popoverModel.enterText + '.' + arr[1]
                    }
                }
            });
            angular.forEach($scope.finalStringList.ORDER_BY, function (data) {
                if (defineId === data.defineId) {
                    var arr = data.text.split('.');
                    data.text = $scope.popoverModel.enterText + '.' + arr[1]
                }
            });
            angular.forEach($scope.finalStringList.FROM, function (data) {
                angular.forEach(data.content, function (content) {
                    if (defineId === content.fromDefineId) {
                        var arr = content.from.split('.');
                        content.from = $scope.popoverModel.enterText + '.' + arr[1]
                    }
                    if (defineId === content.toDefineId) {
                        var arr = content.to.split('.');
                        content.to = $scope.popoverModel.enterText + '.' + arr[1]
                    }
                })
            })
        }
        if ('SELECT' === $scope.popoverFlag) {
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem] = $scope.popoverModel.enterText;
            var defineId = $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].defineId;
            var id = $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].id;
            var mark = $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].mark;
            var str = $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].text.split('.')[1];
            angular.forEach($scope.dataSheetModuleList, function (data) {
                if (defineId === data.defineId) {
                    angular.forEach(data.fields, function (field) {
                        if (str === field.name) {
                            field.alias = $scope.popoverModel.enterText;
                        }
                    })
                }
            });
            angular.forEach($scope.finalStringList.HAVING, function (data) {
                if (id === data.fromId && str === data.from.split('.')[1] && mark === data.fromMark) {
                    data.fromAlias = $scope.popoverModel.enterText
                }
                if (data.relation === 'is in list' || data.relation === 'is not in list') {
                    angular.forEach(data.list, function (list) {
                        if (id === list.id && str === list.text.split('.')[1] && mark === list.mark) {
                            list.alias = $scope.popoverModel.enterText
                        }
                    })
                }else {
                    if (id === data.toId && str === data.to.split('.')[1] && mark === data.toMark) {
                        data.toAlias = $scope.popoverModel.enterText
                    }
                }
            });
            angular.forEach($scope.finalStringList.ORDER_BY, function (data) {
                if (defineId === data.defineId && str === data.text.split('.')[1]) {
                    data.alias = $scope.popoverModel.enterText
                }
            })
        }
    };
    $scope.chooseField_ok = function (field) {
        $scope.popover_cancel();
        if ($scope.popoverFlagIndex >= 0) {
            if ('GROUP_BY' === $scope.popoverFlag) {
                $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].defineId = field.defineId;
                $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].text = field.name
            }
            if ('ORDER_BY' === $scope.popoverFlag) {
                $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].defineId = field.defineId;
                $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].id = field.id;
                $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].text = field.name;
                $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].alias = field.alias
            }
            if ('WHERE' === $scope.popoverFlag) {
                if ('list' === $scope.popoverFlagItem) {
                    $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem][$scope.popoverFlagChildIndex].text = field.name;
                    $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem][$scope.popoverFlagChildIndex].defineId = field.defineId;
                    var index = $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem].length - 1;
                    if ($scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem][index].text) {
                        $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem].push({text: '', defineId: ''})
                    }
                }else {
                    $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem + 'Id'] = field.defineId;
                    $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem] = field.name
                }
            }
            if ('FROM' === $scope.popoverFlag) {
                $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].content[$scope.popoverFlagChildIndex][$scope.popoverFlagItem + 'DefineId'] = field.defineId;
                $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].content[$scope.popoverFlagChildIndex][$scope.popoverFlagItem + 'Id'] = field.id;
                $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].content[$scope.popoverFlagChildIndex][$scope.popoverFlagItem] = field.name;
                if ($scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].content[$scope.popoverFlagChildIndex].fromId && $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].content[$scope.popoverFlagChildIndex].toId) {
                    if ($scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].content[$scope.popoverFlagChildIndex].mark) {
                        $scope.instance.detach($scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].content[$scope.popoverFlagChildIndex].mark, {fireEvent: false});//解绑
                    }
                    $scope.connectionFlag = false;
                    $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].content[$scope.popoverFlagChildIndex].mark = $scope.instance.connect({
                        source: $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].content[$scope.popoverFlagChildIndex].fromId,
                        target: $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].content[$scope.popoverFlagChildIndex].toId
                    });
                }
            }
        }else {
            if ('GROUP_BY' === $scope.popoverFlag) {
                $scope.finalStringList[$scope.popoverFlag].push({text: field.name, defineId: field.defineId})
            }
            if ('ORDER_BY' === $scope.popoverFlag) {
                $scope.finalStringList[$scope.popoverFlag].push({
                    defineId: field.defineId,
                    id: field.id,
                    text: field.name,
                    alias: field.alias,
                    order: 'ASC'
                })
            }
            if ('SELECT' === $scope.popoverFlag) {
                $scope.finalStringList[$scope.popoverFlag].push({
                    defineId: field.defineId,
                    mark: new Date().getTime().toString(),
                    id: field.id,
                    text: field.name,
                    alias: '',
                    constraint: '<func>'
                });
                angular.forEach($scope.dataSheetModuleList, function (module) {
                    if (module.defineId === field.defineId) {
                        var arr = field.name.split('.');
                        var flag = false;
                        angular.forEach(module.fields, function (item) {
                            if (arr[1] === item.name) {
                                item.select = true
                            }
                            if (!item.select) {
                                flag = true
                            }
                        });
                        flag? module.select = false: module.select = true
                    }
                })
            }
        }
    };
    $scope.chooseRelationship_ok = function (relationship) {
        $scope.popover_cancel();
        if ('FROM' === $scope.popoverFlag) {
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].content[$scope.popoverFlagChildIndex][$scope.popoverFlagItem] = relationship
        }else {
            if ('is null' === relationship ||  'is not null' === relationship){
                delete $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].to;
                delete $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].between;
                delete $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].list
            }else if ('is between' === relationship ||  'is not between' === relationship){
                delete $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].list;
                if (!$scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].to) {
                    $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].to = ''
                }
                if (!$scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].between) {
                    $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].between = ''
                }
            }else if ('is in list' === relationship ||  'is not in list' === relationship) {
                delete $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].to;
                delete $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].between;
                $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].list = [{
                    text: '', defineId: '', id:'', alias: '', mark: ''
                }]
            }else {
                if (!$scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].to) {
                    $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].to = ''
                }
                delete $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].list;
                delete $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].between
            }
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].relation = relationship
        }
    };
    $scope.chooseContact_ok = function (contact) {
        $scope.popover_cancel();
        if ('FROM' === $scope.popoverFlag) {
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem][$scope.popoverFlagChildIndex].contact = contact
        }else {
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].contact = contact
        }
    };
    $scope.nodeSelected_ok = function (node) {
        $scope.popover_cancel();
        if ('list' === $scope.popoverFlagItem) {
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem][$scope.popoverFlagChildIndex].text = node.name;
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem][$scope.popoverFlagChildIndex].id = node.id;
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem][$scope.popoverFlagChildIndex].defineId = node.defineId;
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem][$scope.popoverFlagChildIndex].alias = node.alias;
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem][$scope.popoverFlagChildIndex].mark = node.mark;
            var index = $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].list.length - 1;
            if ($scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].list[index].text) {
                $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].list.push({text: '', defineId: '', id:'', alias: '', mark: ''});
            }
         }else {
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem + 'Id'] = node.id;
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem + 'DefineId'] = node.defineId;
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem + 'Alias'] = node.alias;
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem + 'Mark'] = node.mark;
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem] = node.name
        }
    };
    $scope.selectFrom_ok = function (dataSheet) {
        $scope.popover_cancel();
        $scope.addDomInit(dataSheet.id, dataSheet.name, {offset:{top:0,left:0}});
        if ($scope.finalStringList[$scope.popoverFlag].length){
            $scope.finalStringList[$scope.popoverFlag].push({
                defineId: $scope.addData.defineId,
                relation: ',',
                from: dataSheet.name,
                alias: '',
                content: []
            })
        }else {
            $scope.finalStringList[$scope.popoverFlag].push({
                defineId: $scope.addData.defineId,
                from: dataSheet.name,
                alias: ''
            })
        }
    };
    $scope.chooseFromRelation_ok = function (fromRelation) {
        $scope.popover_cancel();
        $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem] = fromRelation
    };
    $scope.chooseConstraint_ok = function (constraint) {
        $scope.popover_cancel();
        $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem] = constraint
    };
    $scope.chooseFromField_ok = function (fromField) {
        $scope.popover_cancel();
        var arr  = $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem].split('.');
        if (arr[1] !== fromField.name) {
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex][$scope.popoverFlagItem] = arr[0] + '.' + fromField.name;
            $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].id = fromField.id;
            angular.forEach($scope.dataSheetModuleList, function (module) {
                if (module.defineId === $scope.finalStringList[$scope.popoverFlag][$scope.popoverFlagIndex].defineId) {
                    var moduleFlag = false;
                    angular.forEach(module.fields,function (field) {
                        var flag = false;
                        field.alias = '';
                        angular.forEach($scope.finalStringList[$scope.popoverFlag],function (data) {
                            if (data.defineId === module.defineId && data.text.split('.')[1] === field.name) {
                                flag = true;
                                field.alias = data.alias
                            }
                        });
                        flag? field.select = true: field.select = false;
                        if (!field.select) {
                            moduleFlag = true
                        }
                    });
                    moduleFlag? module.select = false: module.select = true
                }
            });
            angular.forEach($scope.finalStringList[$scope.popoverFlag], function (select) {
                angular.forEach($scope.finalStringList.HAVING, function (data) {
                    if (select.mark === data.fromMark) {
                        data.from = select.text;
                        data.fromId = select.id
                    }
                    if (select.mark === data.toMark) {
                        data.to = select.text;
                        data.toId = select.id
                    }
                });
                angular.forEach($scope.finalStringList.ORDER_BY, function (data) {
                    data.alias = '';
                    if (select.defineId === data.defineId && select.text.split('.')[1] === data.text.split('.')[1]) {
                        data.alias = select.alias
                    }
                })
            });
        }
    };
    $scope.popover_cancel = function () {
        angular.element(document).click();
    };

    //字符串拼接
    $scope.getLongStr = function () {
        var str = "SELECT ";
        if ($scope.finalStringList.Distinct) {
            str += "DISTINCT\n"
        }else {
            str += "\n"
        }
        angular.forEach($scope.finalStringList.SELECT, function (data, index) {
            var length = $scope.finalStringList.SELECT.length - 1;
            if (data.constraint === '<func>') {
                str += data.text + (data.alias? " AS "+ data.alias: "") + (index < length? ",":"") + "\n"
            }else {
                str += data.constraint + "(" + data.text + ")" + (data.alias? " AS "+ data.alias: "") + (index < length? ",":"") + "\n"
            }
        });
        if ($scope.finalStringList.FROM.length) {
            str += "FROM\n";
            angular.forEach($scope.finalStringList.FROM, function (data, index) {
                if (data.relation) {
                    str += (data.relation === ','?(data.relation + "\n"):('\n' + ((data.relation === '[Custom Join]'?",":data.relation) + " " )));
                }
                str += data.from  + (data.alias? " AS "+ data.alias: "");
                if (data.relation !== ',') {
                    if (data.content && data.content.length) {
                        str += " ON";
                        angular.forEach(data.content, function (content) {
                            str += (content.contact?(" " + content.contact + " "): " ");
                            str += (content.from?content.from:"''") + " " + content.relation + " " + (content.to?content.to:'')
                        })
                    }
                }
            });
            str += "\n";
        }
        if ($scope.finalStringList.WHERE.length) {
            str += "WHERE\n";
            str += "1 = 1 AND\n";
            angular.forEach($scope.finalStringList.WHERE, function (data) {
                if (data.relation === 'like' || data.relation === 'not like') {
                    if (data.from && data.to) {
                        str += (data.contact?(" " + data.contact + "\n"):"") + data.from + " " + data.relation.toUpperCase() + " " + data.to
                    }else {
                        str += (data.contact?(" " + data.contact + "\n"):"") + (data.from || data.to)
                    }
                }else if (data.relation === 'is null' || data.relation === 'is not null') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + data.from + " " + data.relation.toUpperCase()
                }else if (data.relation === 'is between') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + (data.from?(data.from + " BETWEEN "):" ");
                    str += data.to;
                    str += " AND ";
                    str += data.between
                }else if (data.relation === 'is not between') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + (data.from?(data.from + " NOT BETWEEN "):" ");
                    str += data.to;
                    str += " AND ";
                    str += data.between
                }else if (data.relation === 'is in list') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + (data.from?data.from + " IN ":"") + "(";
                    angular.forEach(data.list, function (list, index) {
                        str += list.text + ((index < data.list.length - 1 && data.list[index + 1].text)? ", ": "")
                    });
                    str += ")"
                }else if (data.relation === 'is not in list') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + (data.from?data.from + " NOT IN ":"") + "(";
                    angular.forEach(data.list, function (list, index) {
                        str += list.text + ((index < data.list.length - 1 && data.list[index + 1].text)? ", ": "")
                    });
                    str += ")"
                }else if (data.relation === '[Custom Expression]') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + data.from + " " + data.to
                }else {
                    if (data.from && data.to) {
                        str += (data.contact?(" " + data.contact + "\n"):"") + data.from + " " + data.relation + " " + data.to
                    }else {
                        str += (data.contact?(" " + data.contact + "\n"):"") + (data.from || data.to)
                    }
                }
            });
            str += "\n";
        }
        if ($scope.finalStringList.GROUP_BY.length) {
            str += "GROUP BY\n";
            angular.forEach($scope.finalStringList.GROUP_BY, function (data, index) {
                var length = $scope.finalStringList.GROUP_BY.length - 1;
                str += data.text+ (index < length? ",":"") + "\n"
            });
            str += "\n";
        }
        if ($scope.finalStringList.HAVING.length) {
            str += "HAVING\n";
            angular.forEach($scope.finalStringList.HAVING, function (data) {
                if (data.relation === 'like' || data.relation === 'not like') {
                    if (data.from && data.to) {
                        str += (data.contact?(" " + data.contact + "\n"):"") + data.from + " " + data.relation.toUpperCase() + " " + data.to
                    }else {
                        str += (data.contact?(" " + data.contact + "\n"):"") + (data.from || data.to)
                    }
                }else if (data.relation === 'is null' || data.relation === 'is not null') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + data.from + " " + data.relation.toUpperCase()
                }else if (data.relation === 'is between') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + (data.from?(data.from + " BETWEEN "):" ");
                    str += data.to;
                    str += " AND ";
                    str += data.between
                }else if (data.relation === 'is not between') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + (data.from?(data.from + " NOT BETWEEN "):" ");
                    str += data.to;
                    str += " AND ";
                    str += data.between
                }else if (data.relation === 'is in list') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + (data.from?data.from + " IN ":"") + "(";
                    angular.forEach(data.list, function (list, index) {
                        str += (list.alias?list.alias:list.text) + ((index < data.list.length - 1 && data.list[index + 1].text)? ", ": "")
                    });
                    str += ")"
                }else if (data.relation === 'is not in list') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + (data.from?data.from + " NOT IN ":"") + "(";
                    angular.forEach(data.list, function (list, index) {
                        str += (list.alias?list.alias:list.text) + ((index < data.list.length - 1 && data.list[index + 1].text)? ", ": "")
                    });
                    str += ")"
                }else if (data.relation === '[Custom Expression]') {
                    str += (data.contact?(" " + data.contact + "\n"):"") + data.from + " " + data.to
                }else {
                    if (data.from && data.to) {
                        str += (data.contact?(" " + data.contact + "\n"):"") + data.from + " " + data.relation + " " + data.to
                    }else {
                        str += (data.contact?(" " + data.contact + "\n"):"") + (data.from || data.to)
                    }
                }
            });
            str += "\n";
        }
        if ($scope.finalStringList.ORDER_BY.length) {
            var length = $scope.finalStringList.ORDER_BY.length - 1;
            str += "ORDER BY\n";
            angular.forEach($scope.finalStringList.ORDER_BY, function (data, index) {
                str += (data.alias? data.alias: data.text) + " " + data.order + (index < length? ",\n":"")
            });
            str += "\n";
        }
        if ($scope.finalStringList.LIMIT[0]) {
            str += "LIMIT ";
            str += $scope.finalStringList.LIMIT[0] + ($scope.finalStringList.LIMIT[1]?(", " + $scope.finalStringList.LIMIT[1]): "")
        }
        return str
    };

    //右键菜单
    $scope._configContextMenu = function () {
        $.contextMenu('destroy');
        $.contextMenu({
            selector: '.itemMenu',
            build: function (trigger) {
                var flag = $(trigger).attr('flag');
                var parentIndex = parseInt($(trigger).attr('parentIndex'));
                var triggerIndex = parseInt($(trigger).attr('index'));
                $scope.popover_cancel();
                var menu = {items: {"delete": {name: "删除", icon: "delete"}}};
                menu.items.delete.callback = function () {
                    if ("FROM" === flag && parentIndex >= 0) {
                        if (triggerIndex === 0 && $scope.finalStringList[flag][parentIndex].content[1]) {
                            delete $scope.finalStringList[flag][parentIndex].content[1].contact
                        }
                        if ($scope.finalStringList[flag][parentIndex].content[triggerIndex].mark) {
                            $scope.instance.detach($scope.finalStringList[flag][parentIndex].content[triggerIndex].mark, {fireEvent: false});//解绑
                        }
                        $scope.finalStringList[flag][parentIndex].content.splice(triggerIndex, 1);
                    }else {
                        if ("SELECT" === flag) {
                            angular.forEach($scope.dataSheetModuleList, function (data) {
                                if ($scope.finalStringList[flag][triggerIndex].defineId === data.defineId) {
                                    data.select = false;
                                    angular.forEach(data.fields, function (field) {
                                        if ($scope.finalStringList[flag][triggerIndex].id === field.defineId) {
                                            field.select = false;
                                        }
                                    })
                                }
                            });
                            angular.forEach($scope.finalStringList.ORDER_BY, function (data) {
                                if (data.defineId === $scope.finalStringList[flag][triggerIndex].defineId && $scope.finalStringList[flag][triggerIndex].id === data.id) {
                                    data.alias = ''
                                }
                            });
                            for (var index = $scope.finalStringList.HAVING.length - 1; index >= 0; index --) {
                                if ($scope.finalStringList[flag][triggerIndex].id === $scope.finalStringList.HAVING[index].fromId || $scope.finalStringList[flag][triggerIndex].id === $scope.finalStringList.HAVING[index].toId) {
                                    if (index === 0 && $scope.finalStringList.HAVING.length > 1) {
                                        delete $scope.finalStringList.HAVING[1].contact
                                    }
                                    $scope.finalStringList.HAVING.splice(index, 1)
                                }
                            }
                        }
                        if (triggerIndex === 0 && "WHERE" === flag && $scope.finalStringList[flag][1]) {
                            delete $scope.finalStringList[flag][1].contact
                        }
                        if (triggerIndex === 0 && "HAVING" === flag && $scope.finalStringList[flag][1]) {
                            delete $scope.finalStringList[flag][1].contact
                        }
                        if ("FROM" === flag) {
                            $scope.removeModule($scope.finalStringList[flag][triggerIndex].defineId);
                            if (triggerIndex === 0 && $scope.finalStringList[flag][1]) {
                                delete $scope.finalStringList[flag][1].relation;
                            }
                        }
                        $scope.finalStringList[flag].splice(triggerIndex, 1);
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                };
                return menu;
            }
        });
    };
    $scope._configContextMenu();

    //保存节点坐标，获取生成sql语句
    $scope.btn_ok = function () {
        var model = {database: $scope.model.database, dataSheet: [], router: []};
        angular.forEach($scope.dataSheetModuleList, function (data) {
            data.location = {
                top: angular.element('#' + data.defineId).position().top,
                left: angular.element('#' + data.defineId).position().left
            };
            model.dataSheet.push(data)
        });
        angular.forEach($scope.instance.getAllConnections(), function (data) {
            model.router.push({
                sourceId: data.sourceId,
                targetId: data.targetId
            })
        });
        model.taskSql = $scope.getLongStr();
        $scope.taskSql = $scope.getLongStr();
    };
}]);
